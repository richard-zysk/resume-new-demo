import { Injectable, NotFoundException } from '@nestjs/common';
import * as pdf from 'pdf-parse';
import * as AWS from 'aws-sdk';
import OpenAI from "openai";
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ExtractDataModel } from './schema/extract_data';
import { User } from './schema/user';
import { rejects } from 'assert';

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

    this.openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
     // Extract email using a regular expression
     const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/;
     const emailMatch = resumeText.match(emailRegex);
     const email = emailMatch ? emailMatch[0] : null;

    // const extractedData = await this.gptReview(resumeText);

const store = new this.extractDataModel({

  email: email,
  data: resumeText,
  createdAt: new Date(),
  deletedAt: null,

});

const result = await store.save();

return result;

  }






  async gptReview(email: string): Promise<any> {
    try {
        const data = await this.extractDataModel.findOne({ email: email });

        const resumeText = data.data;

        const messages: Message[] = [
            {
                role: "system",
                content: "You are a sophisticated AI capable of evaluating resumes. Please review the given resume thoroughly, consider skills, work experience, projects, and other relevant factors, and provide a score out of 100. Additionally, extract key details like name, email, phone number, place, skills and the most suitable role for the candidate. Provide the information in a structured JSON format.",
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
        
const saveResponse = await this.storeGptResponseInDb(assistantResponse);

        return saveResponse;

    } catch (error) {
        console.error("An error occurred while reviewing the resume:", error);
        // You can also throw the error or handle it differently if required.
    }
}

  



  async storeGptResponseInDb(assistantResponse): Promise<any> {
    // Parse and structure the GPT response
    const data = JSON.parse(assistantResponse);
console.log(data);

    // Use the userModel to save the data in MongoDB
    const saveInDb = new this.userModel({
        name: data.name,
        email: data.email,
        phone: data.phone,
        place: data.place,
        skills: data.skills,
        score: data.score,
        suitable_role: data.suitable_role,
        data: data,
    });

    const result = await saveInDb.save();
    return result;
}
    

  async fetchEmails() {

    try {
      const emails = await this.extractDataModel.find({},'email')
      return emails
    } catch (error) {
      return error
    }

      }


  async testMyApi() {
    return 'Hello World! from resumer ai';
  }


async signUp(body) {

  try {
    
    
  } catch (error) {
    return error
  }

}

}
