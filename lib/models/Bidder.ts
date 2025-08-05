import mongoose, { Schema, Document, Model, models } from 'mongoose';

export interface IBidder extends Document {
  name: string;
  slack_id: string;
};

const BidderSchema: Schema<IBidder> = new Schema({
  name: { type: String, required: true },
  slack_id: { type: String, required: true },
});

const Bidder: Model<IBidder> = models.Bidder || mongoose.model<IBidder>('Bidder', BidderSchema);
export default Bidder;