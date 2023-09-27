import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class ExtractDataModel extends Document {

  @Prop()
  data: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;



  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const ExtractDataSchema = SchemaFactory.createForClass(ExtractDataModel);
