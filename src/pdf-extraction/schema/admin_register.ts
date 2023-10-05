import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class AdminModel extends Document {

  @Prop()
  email: string;
  


  @Prop({ type: Date, default: Date.now })
  createdAt: Date;



  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const ExtractDataSchema = SchemaFactory.createForClass(AdminModel);
