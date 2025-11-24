// db.js - Firebase Firestore Database Operations
class Database {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            // Firebase configuration
            const firebaseConfig = {
                apiKey: "AIzaSyAtIjjQYwulJ1RxEOpkBZjhBbC2GyyGmw0",
                authDomain: "fdfdff-ae786.firebaseapp.com",
                projectId: "fdfdff-ae786",
                storageBucket: "fdfdff-ae786.firebasestorage.app",
                messagingSenderId: "853545168640",
                appId: "1:853545168640:web:1ef0f66135672d9ab9cde5",
                measurementId: "G-FBJ7JPXMHT"
            };

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.db = firebase.firestore();
            this.initialized = true;
            console.log("Firebase Firestore initialized successfully");
        } catch (error) {
            console.error("Error initializing Firebase:", error);
            throw error;
        }
    }

    // Wait for initialization
    async waitForInit() {
        while (!this.initialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.db;
    }

    // Customer operations
    async addCustomer(customer) {
        try {
            const db = await this.waitForInit();
            const docRef = await db.collection('customers').add({
                ...customer,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding customer:", error);
            throw error;
        }
    }

    async getCustomers() {
        try {
            const db = await this.waitForInit();
            const snapshot = await db.collection('customers')
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error getting customers:", error);
            throw error;
        }
    }

    async updateCustomer(id, customer) {
        try {
            const db = await this.waitForInit();
            await db.collection('customers').doc(id).update({
                ...customer,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error updating customer:", error);
            throw error;
        }
    }

    async deleteCustomer(id) {
        try {
            const db = await this.waitForInit();
            await db.collection('customers').doc(id).delete();
            return true;
        } catch (error) {
            console.error("Error deleting customer:", error);
            throw error;
        }
    }

    async getCustomerByPhone(phone) {
        try {
            const db = await this.waitForInit();
            const snapshot = await db.collection('customers')
                .where('phone', '==', phone)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error("Error getting customer by phone:", error);
            throw error;
        }
    }

    // Invoice operations
    async addInvoice(invoice) {
        try {
            const db = await this.waitForInit();
            const docRef = await db.collection('invoices').add({
                ...invoice,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding invoice:", error);
            throw error;
        }
    }

    async getInvoices() {
        try {
            const db = await this.waitForInit();
            const snapshot = await db.collection('invoices')
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error getting invoices:", error);
            throw error;
        }
    }

    async getInvoiceByNumber(invoiceNumber) {
        try {
            const db = await this.waitForInit();
            const snapshot = await db.collection('invoices')
                .where('invoiceNumber', '==', invoiceNumber)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error("Error getting invoice by number:", error);
            throw error;
        }
    }

    async updateInvoice(id, invoice) {
        try {
            const db = await this.waitForInit();
            await db.collection('invoices').doc(id).update({
                ...invoice,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error updating invoice:", error);
            throw error;
        }
    }

    async deleteInvoice(id) {
        try {
            const db = await this.waitForInit();
            await db.collection('invoices').doc(id).delete();
            return true;
        } catch (error) {
            console.error("Error deleting invoice:", error);
            throw error;
        }
    }

    async getInvoicesByCustomer(customerPhone) {
        try {
            const db = await this.waitForInit();
            const snapshot = await db.collection('invoices')
                .where('customerPhone', '==', customerPhone)
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error getting invoices by customer:", error);
            throw error;
        }
    }

    async getInvoicesByDateRange(startDate, endDate) {
        try {
            const db = await this.waitForInit();
            const snapshot = await db.collection('invoices')
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .orderBy('date', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error getting invoices by date range:", error);
            throw error;
        }
    }

    // Product operations
    async addProduct(product) {
        try {
            const db = await this.waitForInit();
            const docRef = await db.collection('products').add({
                ...product,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding product:", error);
            throw error;
        }
    }

    async getProducts() {
        try {
            const db = await this.waitForInit();
            const snapshot = await db.collection('products')
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error getting products:", error);
            throw error;
        }
    }

    async updateProduct(id, product) {
        try {
            const db = await this.waitForInit();
            await db.collection('products').doc(id).update({
                ...product,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            const db = await this.waitForInit();
            await db.collection('products').doc(id).delete();
            return true;
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    }

    // Recycle bin operations
    async addToRecycleBin(item, type) {
        try {
            const db = await this.waitForInit();
            await db.collection('recycleBin').add({
                ...item,
                type: type,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error adding to recycle bin:", error);
            throw error;
        }
    }

    async getRecycleBinItems() {
        try {
            const db = await this.waitForInit();
            const snapshot = await db.collection('recycleBin')
                .orderBy('deletedAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error getting recycle bin items:", error);
            throw error;
        }
    }

async restoreFromRecycleBin(originalId, type) {
    try {
        const db = await this.waitForInit();
        console.log('Looking for item in recycle bin with original ID:', originalId);

        // Search for the item by its original ID in the recycle bin collection
        const snapshot = await db.collection('recycleBin')
            .where('id', '==', originalId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.error('Item not found in recycle bin with original ID:', originalId);
            throw new Error("Item not found in recycle bin");
        }

        const itemDoc = snapshot.docs[0];
        const recycleBinId = itemDoc.id; // This is the Firestore document ID in recycleBin collection
        const item = itemDoc.data();
        
        console.log('Found item in recycle bin:', item);

        // Remove Firebase-specific fields and the recycle bin specific fields
        const {
            type: itemType,
            id: docId,
            deletedAt,
            ...itemData
        } = item;

        console.log('Cleaned item data for restoration:', itemData);

        // Restore to appropriate collection
        switch (type || itemType) {
            case 'customer':
                await this.addCustomer(itemData);
                break;
            case 'invoice':
                await this.addInvoice(itemData);
                break;
            case 'product':
                await this.addProduct(itemData);
                break;
            default:
                throw new Error("Unknown item type: " + (type || itemType));
        }

        // Remove from recycle bin using the Firestore document ID
        await db.collection('recycleBin').doc(recycleBinId).delete();
        console.log('Item successfully restored and removed from recycle bin');
        return true;
    } catch (error) {
        console.error("Error restoring from recycle bin:", error);
        throw error;
    }
}
async permanentDeleteFromRecycleBin(originalId) {
    try {
        const db = await this.waitForInit();
        console.log('Permanently deleting item from recycle bin with original ID:', originalId);

        // Search for the item by its original ID
        const snapshot = await db.collection('recycleBin')
            .where('id', '==', originalId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.error('Item not found in recycle bin for deletion:', originalId);
            throw new Error("Item not found in recycle bin");
        }

        const itemDoc = snapshot.docs[0];
        await db.collection('recycleBin').doc(itemDoc.id).delete();
        console.log('Item permanently deleted from recycle bin');
        return true;
    } catch (error) {
        console.error("Error permanently deleting from recycle bin:", error);
        throw error;
    }
}

    // Settings operations
    async saveSettings(settings) {
        try {
            const db = await this.waitForInit();
            await db.collection('settings').doc('appSettings').set({
                ...settings,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error saving settings:", error);
            throw error;
        }
    }

    async getSettings() {
        try {
            const db = await this.waitForInit();
            const doc = await db.collection('settings').doc('appSettings').get();

            if (doc.exists) {
                return doc.data();
            } else {
                // Return default settings
                return {
                    companyName: "RSK ENTERPRISES",
                    address: "76(3) Padmavathipuram, Angeripalayam Road, Tirupur 641-602",
                    phone: "8608127349",
                    gstin: "",
                    bankDetails: {
                        accountName: "RSK ENTERPRISES",
                        bank: "CANARA BANK",
                        accountNumber: "120033201829",
                        ifsc: "CNRBOO16563"
                    }
                };
            }
        } catch (error) {
            console.error("Error getting settings:", error);
            throw error;
        }
    }

    // Utility methods
    async getNextInvoiceNumber() {
        try {
            const db = await this.waitForInit();
            const currentYear = new Date().getFullYear().toString().slice(-2);

            // Get the highest invoice number for current year
            const snapshot = await db.collection('invoices')
                .where('invoiceNumber', '>=', `001/${currentYear}`)
                .where('invoiceNumber', '<=', `999/${currentYear}`)
                .orderBy('invoiceNumber', 'desc')
                .limit(1)
                .get();

            if (snapshot.empty) {
                return `001/${currentYear}`;
            }

            const lastInvoice = snapshot.docs[0].data();
            const lastNumber = parseInt(lastInvoice.invoiceNumber.split('/')[0]);
            const nextNumber = (lastNumber + 1).toString().padStart(3, '0');

            return `${nextNumber}/${currentYear}`;
        } catch (error) {
            console.error("Error getting next invoice number:", error);
            throw error;
        }
    }

    // Backup and export operations
    async exportData() {
        try {
            const db = await this.waitForInit();

            const [customers, invoices, products, settings] = await Promise.all([
                this.getCustomers(),
                this.getInvoices(),
                this.getProducts(),
                this.getSettings()
            ]);

            return {
                customers,
                invoices,
                products,
                settings,
                exportDate: new Date().toISOString()
            };
        } catch (error) {
            console.error("Error exporting data:", error);
            throw error;
        }
    }

    async importData(data) {
        try {
            // Import customers
            if (data.customers) {
                for (const customer of data.customers) {
                    await this.addCustomer(customer);
                }
            }

            // Import products
            if (data.products) {
                for (const product of data.products) {
                    await this.addProduct(product);
                }
            }

            // Import invoices
            if (data.invoices) {
                for (const invoice of data.invoices) {
                    await this.addInvoice(invoice);
                }
            }

            // Import settings
            if (data.settings) {
                await this.saveSettings(data.settings);
            }

            return true;
        } catch (error) {
            console.error("Error importing data:", error);
            throw error;
        }
    }
}

// Create global database instance
const db = new Database();