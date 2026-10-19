import mongoose from 'mongoose';

const projectMilestoneSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
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
    requiredDeliverables: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for snake_case compatibility
projectMilestoneSchema.virtual('project_id').get(function () {
  return this.projectId;
});
projectMilestoneSchema.virtual('sequence_order').get(function () {
  return this.sequenceOrder;
});
projectMilestoneSchema.virtual('due_date').get(function () {
  return this.dueDate;
});
projectMilestoneSchema.virtual('required_deliverables').get(function () {
  return this.requiredDeliverables;
});

projectMilestoneSchema.index({ projectId: 1, sequenceOrder: 1 });

export default mongoose.model('ProjectMilestone', projectMilestoneSchema);
