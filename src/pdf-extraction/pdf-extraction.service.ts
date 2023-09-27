import { Injectable } from '@nestjs/common';
import * as pdf from 'pdf-parse';
import * as AWS from 'aws-sdk';
import OpenAI from "openai";
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ExtractDataModel } from './schema/extract_data';
import { User } from './schema/user';

@Injectable()
export class PdfExtractionService {
  private openAi: OpenAI;
  private s3: AWS.S3;

  constructor(
    @InjectModel(ExtractDataModel.name) private extractDataModel: Model<ExtractDataModel>,
    @InjectModel(User.name) private userModel: Model<User>,

  ) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    // this.openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.openAi = new OpenAI({apiKey:'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'});
  }

  async extractAndUploadToS3(
    buffer: Buffer,
    filename: string,
  ): Promise<{ text: string; s3Url: string }> {
    const data = await pdf(buffer);

    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename,
      Body: buffer,
    };

    const s3Response = await this.s3.upload(s3Params).promise();

    return {
      text: data.text,
      s3Url: s3Response.Location,
    };
  }

  async extractTextFromPdf(buffer: Buffer): Promise<any> {
    const data = await pdf(buffer);
    const resumeText = data.text;
    // const extractedData = await this.gptReview(resumeText);

const store = new this.extractDataModel({

  data: resumeText,
  createdAt: new Date(),
  deletedAt: null,

});

const result = await store.save();

return result;

    // return this.gptReview(resumeText);
  }

  // private async gptReview(resumeText: string): Promise<any> {
    async gptReview(): Promise<any> {
      const feedGpt = await this.extractDataModel.findOne();
  
      // if (!feedGpt) {
      //     throw new NotFoundException('No resume data found.');
      // }
  
      const resumeText = feedGpt.data;
  
      type RoleType = "system" | "user" | "assistant";
  
      interface Message {
          role: RoleType;
          content: string;
      }
      const messages: Message[] = [
          {
              role: "system",
              content: "You are a sophisticated AI capable of evaluating resumes. Please review the given resume thoroughly, consider skills, work experience, projects, and other relevant factors, and provide a score out of 100. Additionally, extract key details like name, email, phone number, place, and the most suitable role for the candidate. Provide the information in a structured JSON format.",
          },
          {
              role: "user",
              content: `Here's the resume: ${resumeText}. I rely on your expertise to give a comprehensive review.`,
          },
          {
              role: "system",
              content: "Understood. I will review the resume based on the mentioned criteria and provide a detailed evaluation.",
          },
      ];
  
      const completion = await this.openAi.chat.completions.create({
          messages,
          model: "gpt-3.5-turbo-16k-0613",
          temperature: 0.5
      });
  
      const assistantResponse = completion.choices[0].message.content;
  
      console.log("------------------>", assistantResponse);
      

      // const data = JSON.parse(assistantResponse);
      // console.log(data);

      // const saveInDb = new this.userModel({

      //   name: data.name,
      //   email: data.email,
      //   phone: data.phone,
      //   skills: data.skills,
      //   score:data.score,
      //   data: data,
      // })

      // const result = await saveInDb.save();
  
      // console.log("------------------>", result);
      

      // Parsing the results would be the next step. Depending on the structure of the assistant's response, 
      // you can use regular expressions or other methods to extract the desired information.
  
      // For now, I'm returning the raw assistant response for visibility.
      return assistantResponse;
  }
  



  testMyApi(): string {

    return 'Hello World! from resumer ai';

  }
}
