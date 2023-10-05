// pdf.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfExtractionService } from './pdf-extraction.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfExtractionService: PdfExtractionService) {}

//   @Post('extract-texts')
//   @UseInterceptors(FilesInterceptor('files'))
//   async extractTexts(
//     @UploadedFiles() files,
//   ): Promise<{ filename: string; text: string; s3Url: string }[]> {
//     const extractedData = await Promise.all(
//       files.map(async (file) => {
//         const result = await this.pdfExtractionService.extractAndUploadToS3(
//           file.buffer,
//           file.originalname,
//         );
//         return {
//           filename: file.originalname,
//           text: result.text,
//           s3Url: result.s3Url,
//         };
//       }),
//     );
//     return extractedData;
//   }
// }

@Post('extract-text')
@UseInterceptors(FileInterceptor('file'))
async extractText(@UploadedFile() file): Promise<string> {
  return this.pdfExtractionService.extractTextFromPdf(file.buffer);
}



//! Using this Apis
  @Post('extract-texts')
  @UseInterceptors(FilesInterceptor('files'))
  async extractTexts(
    @UploadedFiles() files,
  ): Promise<{ filename: string; text: string }[]> {

    
    // console.log(files);
    
    const extractedData = await Promise.all(
      files.map(async (file) => ({
        filename: file.originalname,
        text: await this.pdfExtractionService.extractTextFromPdf(file.buffer),
      })),
    );
    return extractedData;
  }

@Post('extract-text-name')
@UseInterceptors(FileInterceptor('file'))
async extractTextAndRespond(@UploadedFile() file): Promise<{ name: string; skills: Array<string> }> {
  // Extract text from the PDF
  const text = await this.pdfExtractionService.extractTextFromPdf(file.buffer);

  // Split the text into lines
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  // The first non-empty line is assumed to be the name (this might not be accurate for all resumes)
  const name = lines[0];

  // Extract skills (this is a basic approach and might need refinement)
  const skillsSection = text.split('Skills')[1] || '';
  const skills = skillsSection.split('\n').map(skill => skill.trim()).filter(skill => skill);

  return {
      name: name,
      skills: skills
  };
}


//! final apis
@Post('evaluate-response')
async testResponse(@Query('email')email:string): Promise<any> {
console.log(email);

  return  await this.pdfExtractionService.gptReview(email);

}

// @Post('generate-score')
// async generateScore(): Promise<any> {

//   return  await this.pdfExtractionService.gptReview();

// }



//!-send this apis
@Get('fetch-emails')
async fetchEmails(): Promise<any> {
  
    return  await this.pdfExtractionService.fetchEmails();
  
}


@Get('health-check')
async testMyApi(): Promise<any> {
  
    return  await this.pdfExtractionService.testMyApi();
  
}




@Post('sign-up')
  async signUp(@Body() body: any): Promise<any> {
    return await this.pdfExtractionService.signUp(body);
  
}









}