import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateActivityDto } from "./dto/activity.dto";
import { uuidv7 } from "uuidv7";

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateActivityDto) {
    const { slug, supportedLanguages, startAt, endAt, ...restData } = dto;

    if (endAt <= startAt) {
      throw new BadRequestException("End date must be after start date");
    }

    const existing = await this.prisma.activity.findUnique({
      where: { slug },
    });
    if (existing) throw new ConflictException("Slug already exists");

    const initialContents = supportedLanguages.map((lang) => ({
      id: uuidv7(),
      lang,
      title: `${dto.name} (${lang})`,
      description: "",
    }));

    return this.prisma.activity.create({
      data: {
        id: uuidv7(),
        ...restData,
        slug,
        supportedLanguages,
        startAt,
        endAt,
        contents: {
          create: initialContents,
        },
      },
      include: { contents: true },
    });
  }
  async findAll() {
    return this.prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  // admin: get by ID
  async findOneById(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: { contents: true },
    });
    if (!activity) throw new NotFoundException("Activity not found");
    return activity;
  }

  // public: get by slug
  async findOneBySlug(slug: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { slug },
      select: {
        slug: true,
        startAt: true,
        endAt: true,
        closedAt: true,
        supportedLanguages: true,
        contents: {
          select: { lang: true, title: true, description: true },
        },
      },
    });
    if (!activity) throw new NotFoundException("Activity not found");
    return activity;
  }
}
