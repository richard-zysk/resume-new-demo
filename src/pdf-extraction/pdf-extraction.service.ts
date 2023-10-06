import { Injectable, NotFoundException } from "@nestjs/common";
import * as pdf from "pdf-parse";
import * as AWS from "aws-sdk";
import OpenAI from "openai";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { ExtractDataModel } from "./schema/extract_data";
import { User } from "./schema/user";
import { AdminModel } from "./schema/admin_register";
import * as jwt from "jsonwebtoken"; 
import { ManagedUpload } from 'aws-sdk/lib/s3/managed_upload';
import { listenerCount } from "process";
import { retry } from "rxjs";
import { error } from "console";

@Injectable()
export class PdfExtractionService {
  private s3: AWS.S3;

  private openAi: OpenAI;

  constructor(
    @InjectModel(ExtractDataModel.name)
    private extractDataModel: Model<ExtractDataModel>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(AdminModel.name) private adminModel: Model<AdminModel>
  ) { 
    this.s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

    
    this.openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }


  async extractTextFromPdf(buffer: Buffer, originalname: string): Promise<any> {
    const data = await pdf(buffer);
    const resumeText = data.text;
    
    // Extract email using a regular expression
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/;
    const emailMatch = resumeText.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : null;

    // Generate a unique key for the S3 object
    const key = `ai/${Date.now()}-${originalname}`;

    // Upload the file to S3 using the generated key
    const s3UploadResponse: ManagedUpload.SendData = await this.uploadToS3(buffer, key);

    // Store the data in your database
    const store = new this.extractDataModel({
      email,
      data: resumeText,
      s3Url: s3UploadResponse.Location,
      createdAt: new Date(),
      deletedAt: null,
    });

    const result = await store.save();

    return result;
  }

  async uploadToS3(file: Buffer, key: string): Promise<ManagedUpload.SendData> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: 'pushai-test-bucket',
      Key: key, // Use the generated key
      Body: file,
    };

    return this.s3.upload(params).promise();
  }


  async gptReview(email: string): Promise<any> {
    try {

      console.log(email);
      

      const data = await this.extractDataModel.findOne({ email: email });

      const resumeText = data.data;

      const messages: Message[] = [
        {
          role: "system",
          content:
            "You are a sophisticated AI capable of evaluating resumes. Please review the given resume thoroughly, consider skills, work experience, projects, and other relevant factors, and provide a score out of 100. Additionally, extract key details like name, email, phone number, place, skills and the most suitable role for the candidate. Provide the information in a structured JSON format.",
        },
        {
          role: "user",
          content: `Here's the resume: ${resumeText}. I rely on your expertise to give a comprehensive review.`,
        },
        {
          role: "system",
          content:
            "Understood. I will review the resume based on the mentioned criteria and provide a detailed evaluation.",
        },
      ];

      const completion = await this.openAi.chat.completions.create({
        messages,
        model: "gpt-3.5-turbo-16k-0613",
        temperature: 0.5,
      });

      const assistantResponse = completion.choices[0].message.content;

      // console.log("------------------>", assistantResponse);

      const saveResponse = await this.storeGptResponseInDb(assistantResponse);

      console.log("content-1-score");
      return "saved the score successfully"
      // return saveResponse;
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
console.log("saveInDb---------------",saveInDb);

    const result = await saveInDb.save();
    return result;
  }






async listOfDataScores(){
  try {
    const dataScores = await this.userModel.find({ isDeleted: false });
    return dataScores;
  } catch (error) {
    console.error("Error fetching data scores:", error);
  throw error; 
  }
}



  async fetchEmails() {
    try {
      const emails = await this.extractDataModel.find({}, "email");
      return emails;
    } catch (error) {
      return error;
    }
  }



  async fetchS3Link() {
    try {
      const emailsAndUrls = await this.extractDataModel.find({}, { email: 1, s3Url: 1, _id: 0 });
      return emailsAndUrls;
    } catch (error) {
      return error;
    }
}


async deleteScoreData(email:string){

  try{
    const updatedUser = await this.userModel.findOneAndUpdate({email:email},{isDeleted:true,deletedAt:new Date()},{new:true})

    if (!updatedUser) {
      return { message: "User not found" };
  }

  return updatedUser;

  }

  catch(error){
    return error

  }
  }


  async testMyApi() {
    return "Hello World! from resumer ai";
  }

  async signUp(body) {
    const { firstName, lastName, email, password } = body;

    try {
      // Create a new instance of AdminModel using the provided body data
      const admin = new this.adminModel({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
      });

      // Save the new admin user to the database
      const result = await admin.save();

      // Return the saved admin user or a success message
      return result;
    } catch (error) {
      // Handle any errors that may occur during signup
      console.error("Error during sign-up:", error.message);
      throw new Error("Sign-up failed.");
    }
  }

  async login(email: string, password: string) {
    const user = await this.adminModel.findOne({ email, password }).exec();
    if (user) {
      // Generate a JWT token upon successful login
      const token = jwt.sign({ userId: user._id }, "your-secret-key", {
        expiresIn: "1h", // Set the token expiration time as per your requirement
      });

      return { token };
    } else {
      return null;
    }
  }
}
