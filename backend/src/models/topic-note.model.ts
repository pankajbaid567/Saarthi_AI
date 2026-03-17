import { model, models, Schema } from 'mongoose';

export type TopicNoteDocument = {
  topicId: string;
  title: string;
  markdown: string;
  createdAt: Date;
  updatedAt: Date;
};

const topicNoteSchema = new Schema<TopicNoteDocument>(
  {
    topicId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    markdown: {
      type: String,
      required: true,
      maxlength: 100000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TopicNoteModel = models.TopicNote || model<TopicNoteDocument>('TopicNote', topicNoteSchema);
