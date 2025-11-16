"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const Product_1 = __importDefault(require("../src/models/Product"));
const User_1 = __importDefault(require("../src/models/User"));
const Order_1 = __importDefault(require("../src/models/Order"));
const database_1 = __importDefault(require("../src/config/database"));
const sampleProducts = [
    {
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
        price: 79.99,
        category: 'Electronics',
        tags: ['audio', 'wireless', 'bluetooth', 'headphones'],
        images: ['https://picsum.photos/seed/headphones1/400/400'],
        inventory: 50,
        features: {
            wireless: true,
            batteryLife: '30 hours',
            noiseCancellation: true
        },
        stats: {
            views: 1250,
            purchases: 45,
            rating: 4.5,
            reviewCount: 38
        }
    },
    {
        name: 'Smart Fitness Watch',
        description: 'Track your fitness goals with heart rate monitoring, GPS, and sleep tracking.',
        price: 149.99,
        category: 'Electronics',
        tags: ['fitness', 'smartwatch', 'health', 'wearable'],
        images: ['https://picsum.photos/seed/watch1/400/400'],
        inventory: 35,
        features: {
            heartRate: true,
            gps: true,
            waterproof: true
        },
        stats: {
            views: 2100,
            purchases: 78,
            rating: 4.7,
            reviewCount: 65
        }
    },
    {
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable, eco-friendly t-shirt made from 100% organic cotton.',
        price: 24.99,
        category: 'Clothing',
        tags: ['organic', 'cotton', 'casual', 'sustainable'],
        images: ['https://picsum.photos/seed/tshirt1/400/400'],
        inventory: 100,
        features: {
            material: 'Organic Cotton',
            sizes: ['S', 'M', 'L', 'XL'],
            sustainable: true
        },
        stats: {
            views: 850,
            purchases: 120,
            rating: 4.3,
            reviewCount: 92
        }
    },
    {
        name: 'Stainless Steel Water Bottle',
        description: 'Insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours.',
        price: 29.99,
        category: 'Home & Kitchen',
        tags: ['water bottle', 'insulated', 'stainless steel', 'eco-friendly'],
        images: ['https://picsum.photos/seed/bottle1/400/400'],
        inventory: 75,
        features: {
            capacity: '750ml',
            insulated: true,
            leakproof: true
        },
        stats: {
            views: 620,
            purchases: 95,
            rating: 4.6,
            reviewCount: 73
        }
    },
    {
        name: 'Yoga Mat Premium',
        description: 'Non-slip yoga mat with extra cushioning for comfort during practice.',
        price: 39.99,
        category: 'Sports',
        tags: ['yoga', 'fitness', 'exercise', 'mat'],
        images: ['https://picsum.photos/seed/yogamat1/400/400'],
        inventory: 60,
        features: {
            thickness: '6mm',
            nonSlip: true,
            ecoFriendly: true
        },
        stats: {
            views: 980,
            purchases: 67,
            rating: 4.4,
            reviewCount: 54
        }
    },
    {
        name: 'Laptop Backpack',
        description: 'Spacious backpack with padded laptop compartment and multiple pockets.',
        price: 59.99,
        category: 'Accessories',
        tags: ['backpack', 'laptop', 'travel', 'storage'],
        images: ['https://picsum.photos/seed/backpack1/400/400'],
        inventory: 40,
        features: {
            laptopSize: 'up to 15.6"',
            waterResistant: true,
            usbPort: true
        },
        stats: {
            views: 1450,
            purchases: 89,
            rating: 4.5,
            reviewCount: 71
        }
    },
    {
        name: 'LED Desk Lamp',
        description: 'Adjustable LED desk lamp with multiple brightness levels and USB charging port.',
        price: 34.99,
        category: 'Home & Kitchen',
        tags: ['lamp', 'led', 'desk', 'lighting'],
        images: ['https://picsum.photos/seed/lamp1/400/400'],
        inventory: 55,
        features: {
            adjustable: true,
            brightnessLevels: 5,
            usbCharging: true
        },
        stats: {
            views: 720,
            purchases: 52,
            rating: 4.2,
            reviewCount: 41
        }
    },
    {
        name: 'Running Shoes',
        description: 'Lightweight running shoes with excellent cushioning and breathable mesh.',
        price: 89.99,
        category: 'Sports',
        tags: ['shoes', 'running', 'athletic', 'footwear'],
        images: ['https://picsum.photos/seed/shoes1/400/400'],
        inventory: 45,
        features: {
            cushioning: 'High',
            breathable: true,
            lightweight: true
        },
        stats: {
            views: 1850,
            purchases: 134,
            rating: 4.6,
            reviewCount: 108
        }
    },
    {
        name: 'Espresso Machine',
        description: 'Compact espresso machine for brewing barista-quality coffee at home.',
        price: 199.99,
        category: 'Home & Kitchen',
        tags: ['coffee', 'espresso', 'machine', 'kitchen'],
        images: ['https://picsum.photos/seed/espresso1/400/400'],
        inventory: 25,
        features: {
            pressure: '15 bar',
            capacity: '1.5L',
            milkFrother: true
        },
        stats: {
            views: 3200,
            purchases: 156,
            rating: 4.8,
            reviewCount: 142
        }
    },
    {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with adjustable DPI and long battery life.',
        price: 24.99,
        category: 'Electronics',
        tags: ['mouse', 'wireless', 'computer', 'ergonomic'],
        images: ['https://picsum.photos/seed/mouse1/400/400'],
        inventory: 80,
        features: {
            wireless: true,
            dpiLevels: 3,
            batteryLife: '12 months'
        },
        stats: {
            views: 890,
            purchases: 145,
            rating: 4.3,
            reviewCount: 98
        }
    },
    {
        name: 'Cookbook: Healthy Meals',
        description: 'Collection of 100+ healthy and delicious recipes for every meal.',
        price: 19.99,
        category: 'Books',
        tags: ['cookbook', 'recipes', 'healthy', 'cooking'],
        images: ['https://picsum.photos/seed/cookbook1/400/400'],
        inventory: 90,
        features: {
            pages: 250,
            recipes: 120,
            illustrated: true
        },
        stats: {
            views: 560,
            purchases: 78,
            rating: 4.5,
            reviewCount: 62
        }
    },
    {
        name: 'Portable Phone Charger',
        description: 'High-capacity portable charger with fast charging for all devices.',
        price: 39.99,
        category: 'Electronics',
        tags: ['charger', 'portable', 'battery', 'power bank'],
        images: ['https://picsum.photos/seed/charger1/400/400'],
        inventory: 65,
        features: {
            capacity: '20000mAh',
            fastCharging: true,
            ports: 2
        },
        stats: {
            views: 1120,
            purchases: 187,
            rating: 4.4,
            reviewCount: 156
        }
    },
    {
        name: 'Indoor Plant - Monstera',
        description: 'Beautiful monstera plant in decorative pot, perfect for home or office.',
        price: 44.99,
        category: 'Home & Garden',
        tags: ['plant', 'indoor', 'decoration', 'monstera'],
        images: ['https://picsum.photos/seed/plant1/400/400'],
        inventory: 30,
        features: {
            potIncluded: true,
            lowMaintenance: true,
            airPurifying: true
        },
        stats: {
            views: 780,
            purchases: 56,
            rating: 4.7,
            reviewCount: 43
        }
    },
    {
        name: 'Bamboo Cutting Board Set',
        description: 'Set of 3 eco-friendly bamboo cutting boards in different sizes.',
        price: 34.99,
        category: 'Home & Kitchen',
        tags: ['cutting board', 'bamboo', 'kitchen', 'eco-friendly'],
        images: ['https://picsum.photos/seed/cuttingboard1/400/400'],
        inventory: 50,
        features: {
            material: 'Bamboo',
            set: 3,
            antimicrobial: true
        },
        stats: {
            views: 540,
            purchases: 67,
            rating: 4.3,
            reviewCount: 51
        }
    },
    {
        name: 'Resistance Bands Set',
        description: 'Complete set of resistance bands for home workouts with carrying case.',
        price: 29.99,
        category: 'Sports',
        tags: ['resistance bands', 'fitness', 'workout', 'exercise'],
        images: ['https://picsum.photos/seed/bands1/400/400'],
        inventory: 70,
        features: {
            levels: 5,
            portable: true,
            withAnchors: true
        },
        stats: {
            views: 950,
            purchases: 112,
            rating: 4.5,
            reviewCount: 89
        }
    }
];
const sampleUsers = [
    {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        preferences: {
            categories: ['Electronics', 'Sports'],
            priceRange: { min: 0, max: 200 }
        }
    },
    {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        preferences: {
            categories: ['Clothing', 'Home & Kitchen'],
            priceRange: { min: 0, max: 100 }
        }
    },
    {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'password123',
        preferences: {
            categories: ['Books', 'Electronics'],
            priceRange: { min: 0, max: 150 }
        }
    }
];
async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');
        await (0, database_1.default)();
        console.log('🗑️  Clearing existing data...');
        await Promise.all([
            Product_1.default.deleteMany({}),
            User_1.default.deleteMany({}),
            Order_1.default.deleteMany({})
        ]);
        console.log('📦 Seeding products...');
        const products = await Product_1.default.insertMany(sampleProducts);
        console.log(`✅ Created ${products.length} products`);
        console.log('👤 Seeding users...');
        const users = await User_1.default.insertMany(sampleUsers);
        console.log(`✅ Created ${users.length} users`);
        console.log('📊 Adding user interactions...');
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const randomProducts = products
                .sort(() => 0.5 - Math.random())
                .slice(0, 5);
            user.viewHistory = randomProducts.map(p => ({
                productId: p._id,
                viewedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                duration: Math.floor(Math.random() * 120) + 10
            }));
            await user.save();
        }
        console.log('🛒 Creating sample orders...');
        const sampleOrders = users.map((user, index) => {
            const orderProducts = products.slice(index * 2, index * 2 + 2);
            return {
                userId: user._id,
                items: orderProducts.map(p => ({
                    productId: p._id,
                    quantity: Math.floor(Math.random() * 3) + 1,
                    price: p.price
                })),
                totalAmount: orderProducts.reduce((sum, p) => sum + p.price, 0),
                shippingAddress: {
                    street: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    zipCode: '94102',
                    country: 'USA'
                },
                status: ['pending', 'processing', 'shipped'][index % 3]
            };
        });
        const orders = await Order_1.default.insertMany(sampleOrders);
        console.log(`✅ Created ${orders.length} orders`);
        for (let i = 0; i < users.length; i++) {
            await User_1.default.findByIdAndUpdate(users[i]._id, {
                $push: {
                    purchaseHistory: {
                        orderId: orders[i]._id,
                        purchasedAt: new Date()
                    }
                }
            });
        }
        console.log('✅ Database seeding completed successfully!');
        console.log('\n📝 Sample credentials:');
        console.log('   Email: john@example.com');
        console.log('   Password: password123\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}
seedDatabase();
//# sourceMappingURL=seedDatabase.js.map