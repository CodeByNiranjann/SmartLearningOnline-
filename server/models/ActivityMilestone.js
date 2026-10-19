import mongoose from 'mongoose';

const activityMilestoneSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectActivity',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    sequenceOrder: {
      type: Number,
      required: true,
      default: 1,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    expectedDeliverables: [
      {
        type: String,
        trim: true,
      },
    ],
    requiredDeliverables: [
      {
        type: String,
        trim: true,
      },
    ],
    completionRequirements: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

activityMilestoneSchema.pre('save', function (next) {
  if (this.expectedDeliverables?.length && (!this.requiredDeliverables || !this.requiredDeliverables.length)) {
    this.requiredDeliverables = this.expectedDeliverables;
  } else if (this.requiredDeliverables?.length && (!this.expectedDeliverables || !this.expectedDeliverables.length)) {
    this.expectedDeliverables = this.requiredDeliverables;
  }
  next();
});

activityMilestoneSchema.virtual('activityId').get(function () {
  return this.activity;
});

activityMilestoneSchema.index({ activity: 1, sequenceOrder: 1 });

export default mongoose.model('ActivityMilestone', activityMilestoneSchema);
