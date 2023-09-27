import { Module } from '@nestjs/common';
import { PdfExtractionService } from './pdf-extraction.service';
import { PdfController } from './pdf-extraction.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user';
import { ExtractDataModel, ExtractDataSchema } from './schema/extract_data';

@Module({
  // imports: [ MongooseModule.forRoot(process.env.MONGODB_URI),
  imports:[
    MongooseModule.forRoot('mongodb+srv://richardandrewzysk:L34bp56x3dolcsTC@cluster0.jfyd2p0.mongodb.net/hackthon?retryWrites=true&w=majority'),
    MongooseModule.forFeature([
{ name: User.name, schema: UserSchema },
{ name: ExtractDataModel.name, schema: ExtractDataSchema}
   
    ]),],
  controllers: [PdfController],
  providers: [PdfExtractionService],
})
export class PdfExtractionModule {}
