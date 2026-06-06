const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vendorbridge';
const DATA_DIR = path.join(__dirname, 'data');

let isMongoConnected = false;

// 1. Define Mongoose Schemas & Models
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['officer', 'vendor', 'manager', 'admin'] },
  name: { type: String, required: true },
  vendorId: { type: String, default: null }, // If role is vendor
  createdAt: { type: Date, default: Date.now }
});

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gstDetails: { type: String, required: true },
  status: { type: String, default: 'active', enum: ['active', 'inactive'] },
  rating: { type: Number, default: 5.0 },
  createdAt: { type: Date, default: Date.now }
});

const RFQSchema = new mongoose.Schema({
  title: { type: String, required: true },
  specification: { type: String, required: true },
  quantity: { type: Number, required: true },
  deadline: { type: Date, required: true },
  assignedVendors: [{ type: String }], // Array of Vendor IDs
  status: { type: String, default: 'published', enum: ['published', 'closed'] },
  createdAt: { type: Date, default: Date.now }
});

const QuotationSchema = new mongoose.Schema({
  rfqId: { type: String, required: true },
  rfqTitle: { type: String, required: true },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  price: { type: Number, required: true },
  deliveryTimeline: { type: String, required: true },
  notes: { type: String },
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  remarks: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  rfqId: { type: String, required: true },
  rfqTitle: { type: String, required: true },
  quotationId: { type: String, required: true },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'issued', enum: ['issued', 'acknowledged', 'cancelled'] },
  createdAt: { type: Date, default: Date.now }
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  poNumber: { type: String, required: true },
  rfqTitle: { type: String, required: true },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'unpaid', enum: ['unpaid', 'paid'] },
  distributionLogs: [{
    action: String, // 'printed', 'emailed', 'downloaded'
    timestamp: Date,
    details: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const ActivityLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

let Models = {};

// 2. Initialize connection
async function initDB() {
  try {
    // Attempt Mongoose connection with 2 second timeout
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log(`\x1b[32m[VendorBridge DB] Successfully connected to MongoDB at ${MONGODB_URI}\x1b[0m`);
    
    Models = {
      User: mongoose.model('User', UserSchema),
      Vendor: mongoose.model('Vendor', VendorSchema),
      RFQ: mongoose.model('RFQ', RFQSchema),
      Quotation: mongoose.model('Quotation', QuotationSchema),
      PurchaseOrder: mongoose.model('PurchaseOrder', PurchaseOrderSchema),
      Invoice: mongoose.model('Invoice', InvoiceSchema),
      ActivityLog: mongoose.model('ActivityLog', ActivityLogSchema)
    };
  } catch (error) {
    console.warn(`\x1b[33m[VendorBridge DB] MongoDB connection failed: ${error.message}\x1b[0m`);
    console.warn(`\x1b[36m[VendorBridge DB] Falling back to JSON local file storage under ${DATA_DIR}\x1b[0m`);
    isMongoConnected = false;
    
    // Ensure JSON directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Helper for JSON mode to read a collection file
async function readJSON(collectionName) {
  const filePath = path.join(DATA_DIR, `${collectionName.toLowerCase()}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // If file doesn't exist, return empty array and create it
    await fs.writeFile(filePath, JSON.stringify([], null, 2));
    return [];
  }
}

// Helper for JSON mode to write a collection file
async function writeJSON(collectionName, data) {
  const filePath = path.join(DATA_DIR, `${collectionName.toLowerCase()}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// 3. Unified DB Interface Methods
const db = {
  init: initDB,
  isMongo: () => isMongoConnected,

  async find(collectionName, query = {}) {
    if (isMongoConnected) {
      return await Models[collectionName].find(query).lean();
    } else {
      const data = await readJSON(collectionName);
      return data.filter(item => {
        for (let key in query) {
          if (query[key] !== undefined && item[key] !== query[key]) {
            // Support matching array inclusions (like assignedVendors)
            if (Array.isArray(item[key])) {
              if (!item[key].includes(query[key])) return false;
            } else {
              return false;
            }
          }
        }
        return true;
      });
    }
  },

  async findOne(collectionName, query = {}) {
    if (isMongoConnected) {
      return await Models[collectionName].findOne(query).lean();
    } else {
      const data = await this.find(collectionName, query);
      return data.length > 0 ? data[0] : null;
    }
  },

  async findById(collectionName, id) {
    if (isMongoConnected) {
      return await Models[collectionName].findById(id).lean();
    } else {
      return await this.findOne(collectionName, { _id: id });
    }
  },

  async create(collectionName, doc) {
    if (isMongoConnected) {
      const newDoc = new Models[collectionName](doc);
      const saved = await newDoc.save();
      return saved.toObject();
    } else {
      const data = await readJSON(collectionName);
      const newDoc = {
        _id: 'local_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
        ...doc,
        createdAt: new Date().toISOString()
      };
      data.push(newDoc);
      await writeJSON(collectionName, data);
      return newDoc;
    }
  },

  async findByIdAndUpdate(collectionName, id, update) {
    if (isMongoConnected) {
      return await Models[collectionName].findByIdAndUpdate(id, update, { new: true }).lean();
    } else {
      const data = await readJSON(collectionName);
      const index = data.findIndex(item => item._id === id);
      if (index === -1) return null;
      
      // Handle Mongoose style update object (e.g. $push, or just flat fields)
      let updatedItem = { ...data[index] };
      if (update.$push) {
        for (let key in update.$push) {
          if (!updatedItem[key]) updatedItem[key] = [];
          updatedItem[key].push(update.$push[key]);
        }
        delete update.$push;
      }
      
      updatedItem = { ...updatedItem, ...update };
      data[index] = updatedItem;
      await writeJSON(collectionName, data);
      return updatedItem;
    }
  },

  async updateOne(collectionName, query, update) {
    if (isMongoConnected) {
      return await Models[collectionName].updateOne(query, update);
    } else {
      const item = await this.findOne(collectionName, query);
      if (!item) return { nModified: 0 };
      await this.findByIdAndUpdate(collectionName, item._id, update);
      return { nModified: 1 };
    }
  },

  async deleteMany(collectionName, query = {}) {
    if (isMongoConnected) {
      return await Models[collectionName].deleteMany(query);
    } else {
      const data = await readJSON(collectionName);
      const filtered = data.filter(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return true;
        }
        return false;
      });
      await writeJSON(collectionName, filtered);
      return { deletedCount: data.length - filtered.length };
    }
  }
};

module.exports = db;
