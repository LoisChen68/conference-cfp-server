import { Controller, Get, Query, Res, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { Response, Request } from "express";
import { generateState } from "arctic";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("github")
  githubLogin(@Res() res: Response) {
    const state = generateState();
    const url = this.authService.createGithubAuthUrl(state);

    res.cookie("github_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600000,
      path: "/",
    });

    return res.redirect(url.toString());
  }

  @Get("github/callback")
  async githubCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const storedState = req.cookies["github_oauth_state"] as string | undefined;

    if (!state || !storedState || state !== storedState) {
      return res.status(400).send("Invalid state");
    }

    res.clearCookie("github_oauth_state");

    try {
      const { access_token } = await this.authService.loginWithGithub(code);

      res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400000,
        path: "/",
      });

      return res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'AUTH_SUCCESS' }, '${clientUrl}');
              window.close();
            </script>
            <p>Login successful, redirecting...</p>
          </body>
        </html>
      `);
    } catch (error: unknown) {
      let message = "unexpected error";

      if (error instanceof Error) {
        message = error.message;
      }

      return res.send(`
        <script>
          window.opener.postMessage({ type: 'AUTH_ERROR', message: '${JSON.stringify(message)}' }, '${clientUrl}');
          window.close();
        </script>
      `);
    }
  }
}
