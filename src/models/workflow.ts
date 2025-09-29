import mongoose, { Model, Document } from 'mongoose'
import { DataSchema } from '@membranehq/sdk'

// Workflow Node Interface
export interface IWorkflowNode {
  id: string
  name: string
  type: 'trigger' | 'action'
  nodeType?: string
  triggerType?: string
  parametersSchema?: DataSchema
  inputMapping: Record<string, unknown>
  config?: Record<string, unknown>
}

// Main Workflow Interface
export interface IWorkflow {
  name: string
  description?: string
  status: 'draft' | 'active' | 'inactive'
  nodes: IWorkflowNode[]
  userId?: string
  customerId?: string
  version: number
  lastRunAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Instance methods interface
export interface IWorkflowMethods {
  activate(): Promise<IWorkflowDocument>
  deactivate(): Promise<IWorkflowDocument>
  updateLastRun(): Promise<IWorkflowDocument>
}

// Static methods interface
export interface IWorkflowModel extends Model<IWorkflow, object, IWorkflowMethods> {
  findByUser(userId: string): Promise<IWorkflowDocument[]>
  findByStatus(status: 'draft' | 'active' | 'inactive'): Promise<IWorkflowDocument[]>
}

// Document type
export type IWorkflowDocument = Document<unknown, object, IWorkflow> &
  IWorkflow &
  IWorkflowMethods & {
    _id: mongoose.Types.ObjectId
  }

// Workflow Node Schema
const workflowNodeSchema = new mongoose.Schema<IWorkflowNode>(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['trigger', 'action'],
    },
    nodeType: {
      type: String,
      trim: true,
    },
    triggerType: {
      type: String,
      trim: true,
    },
    inputMapping: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    config: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false },
)

// Main Workflow Schema
const workflowSchema = new mongoose.Schema<IWorkflow>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive'],
      default: 'draft',
      index: true,
    },
    nodes: {
      type: [workflowNodeSchema],
      default: [],
    },
    userId: {
      type: String,
      trim: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    lastRunAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

workflowSchema.index({ userId: 1, status: 1 })
workflowSchema.index({ status: 1, updatedAt: -1 })
workflowSchema.index({ customerId: 1, status: 1, createdAt: -1 })

// Add pre-save middleware to increment version on updates
workflowSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('nodes')) {
    this.version += 1
  }
  next()
})

workflowSchema.methods = {
  activate: function () {
    this.status = 'active'
    return this.save()
  },

  deactivate: function () {
    this.status = 'inactive'
    return this.save()
  },

  updateLastRun: function () {
    this.lastRunAt = new Date()
    return this.save()
  },
}

workflowSchema.statics = {
  findByUser: function (userId: string) {
    return this.find({ userId }).sort({ createdAt: -1 })
  },

  findByStatus: function (status: 'draft' | 'active' | 'inactive') {
    return this.find({ status }).sort({ createdAt: -1 })
  },
}

export const Workflow =
  (mongoose.models.Workflow as IWorkflowModel) || mongoose.model<IWorkflow, IWorkflowModel>('Workflow', workflowSchema)
