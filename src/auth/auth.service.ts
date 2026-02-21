import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { GitHub } from "arctic";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { uuidv7 } from "uuidv7";

interface GithubProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  company: string | null;
  bio: string | null;
  html_url: string;
  location: string | null;
}

interface GithubSocial {
  provider: string;
  url: string;
}

@Injectable()
export class AuthService {
  private github: GitHub;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.github = new GitHub(
      process.env.GITHUB_CLIENT_ID!,
      process.env.GITHUB_CLIENT_SECRET!,
      process.env.GITHUB_REDIRECT_URI!,
    );
  }

  createGithubAuthUrl(state: string) {
    return this.github.createAuthorizationURL(state, ["user:email"]);
  }

  private async fetchGithub<T>(endpoint: string, token: string): Promise<T> {
    const response = await fetch(`https://api.github.com/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "NestJS-Auth-App",
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    return response.json() as T;
  }

  async loginWithGithub(code: string) {
    try {
      const tokens = await this.github.validateAuthorizationCode(code);
      const accessToken = tokens.accessToken();

      const [githubUser, githubEmails, socialAccounts] = await Promise.all([
        this.fetchGithub<GithubProfile>("user", accessToken),
        this.fetchGithub<{ email: string; primary: boolean }[]>(
          "user/emails",
          accessToken,
        ),
        this.fetchGithub<GithubSocial[]>("user/social_accounts", accessToken),
      ]);

      const email =
        githubUser.email || githubEmails.find((e) => e.primary)?.email;

      if (!email) {
        throw new UnauthorizedException(
          "Unable to obtain a valid email address from GitHub",
        );
      }

      const githubProfileLink = {
        id: uuidv7(),
        type: "github",
        url: githubUser.html_url,
      };

      const otherSocialLinks = socialAccounts.map((account) => ({
        id: uuidv7(),
        type: account.provider,
        url: account.url,
      }));

      const allLinks = [githubProfileLink, ...otherSocialLinks];

      let user = await this.prisma.member.findUnique({
        where: { email },
        include: { providers: true },
      });

      if (!user) {
        user = await this.prisma.member.create({
          data: {
            id: uuidv7(),
            email,
            displayName: githubUser.name || githubUser.login,
            avatarUrl: githubUser.avatar_url,
            organization: githubUser.company,
            bio: githubUser.bio,
            location: githubUser.location,
            memberLinks: { create: allLinks },
            providers: {
              create: {
                id: uuidv7(),
                provider: "github",
                providerUserId: String(githubUser.id),
              },
            },
          },

          include: { providers: true },
        });
      } else {
        const hasGithub = user.providers.some((p) => p.provider === "github");
        if (!hasGithub) {
          await this.prisma.memberProvider.create({
            data: {
              id: uuidv7(),
              memberId: user.id,
              provider: "github",
              providerUserId: String(githubUser.id),
            },
          });
        }
      }

      return {
        access_token: await this.jwtService.signAsync({
          sub: user.id,
          email: user.email,
        }),
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : "Unknown error";

      this.logger.error(
        `GitHub login error: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new UnauthorizedException(
        `GitHub Authentication Failed: ${message}`,
      );
    }
  }
}
