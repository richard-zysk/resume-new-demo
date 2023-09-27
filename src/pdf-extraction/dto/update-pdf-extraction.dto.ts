import { PartialType } from '@nestjs/mapped-types';
import { CreatePdfExtractionDto } from './create-pdf-extraction.dto';

export class UpdatePdfExtractionDto extends PartialType(CreatePdfExtractionDto) {}
