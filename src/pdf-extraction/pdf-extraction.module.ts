import { Module } from '@nestjs/common';
import { PdfExtractionService } from './pdf-extraction.service';
import { PdfController } from './pdf-extraction.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user';
import { ExtractDataModel, ExtractDataSchema } from './schema/extract_data';
import { ConfigModule } from '@nestjs/config';

@Module({
  // imports: [ MongooseModule.forRoot(process.env.MONGODB_URI),
  imports:[
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),

    MongooseModule.forFeature([
{ name: User.name, schema: UserSchema },
{ name: ExtractDataModel.name, schema: ExtractDataSchema}
   
    ]),],
  controllers: [PdfController],
  providers: [PdfExtractionService],
})
export class PdfExtractionModule {}
