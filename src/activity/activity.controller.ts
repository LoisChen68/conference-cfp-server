import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ActivityService } from "./activity.service";
import { CreateActivityDto } from "./dto/activity.dto";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { Public } from "src/auth/decorators/public.decorator";

@ApiTags("Activities")
@Controller("activities")
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  // ========== Public API ==========

  // public: get by slug (only active)
  @Public()
  @Get("slug/:slug")
  @ApiOperation({ summary: "Get activity by Slug (for public)" })
  async findBySlug(@Param("slug") slug: string, @Query("lang") lang?: string) {
    return this.activityService.findOneBySlug(slug, lang);
  }

  // ========== Admin API ==========

  @Permissions("activity:manage")
  @Post()
  @ApiOperation({ summary: "Create new activity with contents" })
  @ApiResponse({ status: 201, description: "Created successfully" })
  async create(@Body() dto: CreateActivityDto) {
    return this.activityService.create(dto);
  }

  @Permissions("activity:manage")
  @Get()
  @ApiOperation({ summary: "Get all activities" })
  async findAll() {
    return this.activityService.findAll();
  }

  // admin: get by ID (includes all languages)
  @Permissions("activity:manage")
  @Get(":id")
  @ApiOperation({ summary: "Get activity by ID (for admin)" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.activityService.findOneById(id);
  }
}
