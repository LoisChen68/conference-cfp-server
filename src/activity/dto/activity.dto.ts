import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsString,
  IsArray,
  Length,
  Matches,
  ArrayMinSize,
  IsLocale,
  IsOptional,
  IsDate,
} from "class-validator";

export class CreateActivityDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @Transform(({ value }): string =>
    typeof value === "string" ? value.toLowerCase().trim() : value,
  )
  @Length(3, 64, { message: "Slug must be between 3 and 64 characters long" })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Slug must contain only lowercase letters, numbers, and hyphens (-), and cannot start or end with a hyphen",
  })
  slug: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startAt: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  endAt: Date;

  @ApiProperty({
    type: [String],
    example: ["zh-tw", "en-us"],
    description: "List of supported language codes",
  })
  @IsArray()
  @Transform(({ value }: { value: string[] }): string[] =>
    Array.isArray(value)
      ? value.map((v) => (typeof v === "string" ? v.toLowerCase() : v))
      : value,
  )
  @ArrayMinSize(1, {
    message: "At least one supported language must be provided",
  })
  @IsString({ each: true })
  @IsLocale({
    each: true,
    message: "Each language code must be a valid locale (e.g., zh-TW, en-US)",
  })
  supportedLanguages: string[];

  @ApiPropertyOptional({ description: "Manual closure timestamp" })
  @IsOptional()
  @Type(() => Date)
  closedAt?: Date;
}
