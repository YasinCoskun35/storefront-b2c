# Storefront - B2C E-Commerce Catalog & Order Platform

> A modern B2C storefront for browsing a product catalog, checking out as a guest, and paying online — with an admin dashboard for catalog, content, and order management.

[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 **Table of Contents**

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Contributing](#contributing)

---

## 🎯 **Overview**

Storefront is a production-ready B2C catalog and order platform. It enables:

- **Product Catalog**: Browse products and bundles with real pricing
- **Guest Checkout**: No account required — add to cart and check out as a guest
- **Online Payment**: Checkout is processed through iyzico
- **Order Tracking**: Admins track orders from placement to delivery
- **Bundle Products**: Create product sets (e.g., Living Room Set = Sofa + Chairs + Table)
- **ERP Sync**: Optional Netsis integration keeps products and stock levels up to date

---

## ✨ **Features**

### **Catalog Management**
- ✅ **Product Types**: Simple products and product bundles/sets
- ✅ **Hierarchical Categories**: Parent/child category structure
- ✅ **Brand Management**: Associate products with manufacturers
- ✅ **Advanced Search**: PostgreSQL trigram-based fuzzy search
- ✅ **Image Processing**: Automatic WebP conversion with multiple sizes (async background processing)
- ✅ **SEO Optimization**: Auto-generated slugs, meta tags, sitemaps

### **Shopping & Checkout**
- ✅ **Guest Cart**: Persistent cart identified by a guest ID, no login required
- ✅ **Checkout**: Delivery details captured at checkout
- ✅ **Online Payment**: iyzico payment integration with success/fail redirects
- ✅ **Order Comments**: Communication thread on each order (status updates, notes)

### **Netsis ERP Integration**
- ✅ **Product Sync**: Pull product master data from Netsis and upsert into the catalog
- ✅ **Stock Sync**: Keep stock levels and status current
- ✅ **Scheduled + Manual**: Runs on an interval, or trigger on demand from the admin API

### **Admin Dashboard** (Web)
- ✅ **Product Management**: CRUD with drag-drop image upload
- ✅ **Category Management**: Hierarchical structure with drag-drop reordering
- ✅ **Bundle Builder**: Create product sets with components
- ✅ **Content Management**: Blog posts and static pages with rich text editor
- ✅ **User Management**: Role-based access control (Admin, Manager, User)
- ✅ **Order Dashboard**: Review orders, update status, track fulfillment

### **Technical Features**
- ✅ **Modular Monolith**: Clean separation with isolated database schemas
- ✅ **CQRS Pattern**: MediatR for commands and queries
- ✅ **Result Pattern**: Explicit error handling without exceptions
- ✅ **JWT Authentication**: Secure admin authentication with refresh tokens
- ✅ **Background Jobs**: Image processing and Netsis sync via background services
- ✅ **Docker Ready**: Complete containerization for development and production
- ✅ **Comprehensive Tests**: Architecture, unit, and integration tests

---

## 🏗️ **Architecture**

### **Modular Monolith Design**

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (Nginx)                   │
└────────────┬────────────────────────────────┬───────────┘
             │                                 │
    ┌────────▼─────────┐              ┌───────▼──────────┐
    │   .NET 10 API    │              │   Next.js 15     │
    │   (Backend)      │              │   (Admin Panel)  │
    └────────┬─────────┘              └──────────────────┘
             │
    ┌────────▼────────────────────────────────────────────┐
    │              PostgreSQL 16                          │
    │  ┌──────────┬──────────┬──────────┬──────────┐      │
    │  │ identity │ catalog  │ content  │  orders  │      │  (schemas)
    │  └──────────┴──────────┴──────────┴──────────┘      │
    └─────────────────────────────────────────────────────┘
```

### **Module Isolation**

Each module has:
- **Separate Schema**: `identity`, `catalog`, `content`, `orders`
- **Own Migration History**: `__EFMigrationsHistory_<Module>`
- **Independent Boundaries**: Modules cannot reference each other
- **Clean Architecture**: Domain → Application → Infrastructure → API

### **Layers**

```
┌─────────────────┐
│   API Layer     │  Controllers (thin, delegate to MediatR)
├─────────────────┤
│ Infrastructure  │  DbContext, Services, Background Jobs
├─────────────────┤
│  Application    │  Commands, Queries, Validators (CQRS)
├─────────────────┤
│     Domain      │  Entities, Value Objects, Enums
└─────────────────┘
```

---

## 🛠️ **Tech Stack**

### **Backend**
- **.NET 10 LTS** - Latest long-term support release
- **C# 14** - Modern language features
- **PostgreSQL 16** - Robust relational database with trigram search
- **Entity Framework Core 10** - ORM with schema isolation
- **MediatR** - CQRS pattern implementation
- **FluentValidation** - Request validation pipeline
- **ImageSharp** - Image processing and optimization
- **JWT** - Authentication and authorization
- **Iyzipay** - Payment processing

### **Frontend (Storefront + Admin Panel)**
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with Server Components
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **TanStack Query v5** - Server state management
- **React Hook Form** - Form handling
- **TipTap** - Rich text editor

### **Infrastructure**
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy and static file serving
- **GitHub Actions** - CI/CD (coming soon)

### **Testing**
- **xUnit** - Test framework
- **NSubstitute** - Mocking library
- **FluentAssertions** - Assertion library
- **NetArchTest** - Architecture rules validation
- **Testcontainers** - Integration testing with real PostgreSQL

---

## 🚀 **Getting Started**

### **Prerequisites**

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (required for PostgreSQL)
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/) (for the storefront/admin panel)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended)

### **Quick Start (5 minutes)**

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Storefront

# 2. Start PostgreSQL
docker-compose up -d

# 3. Start Backend API
cd src/API/Storefront.Api
dotnet run

# Backend runs at: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger

# 4. Start Storefront / Admin Panel
cd web
npm install
npm run dev

# Storefront: http://localhost:3000
```

### **Default Admin Credentials**

```
Email: admin@storefront.com
Password: AdminPassword123!
```

---

## 📖 **Documentation**

### **Getting Started**
- [Installation Guide](docs/INSTALLATION.md) - Detailed setup instructions
- [Quick Reference](docs/QUICK_REFERENCE.md) - Common commands
- [Startup Guide](docs/STARTUP_GUIDE.md) - Troubleshooting startup issues

### **Development**
- [Architecture Guide](docs/ARCHITECTURE.md) - System design and principles
- [API Reference](docs/API_REFERENCE.md) - Complete endpoint documentation
- [Testing Guide](docs/TESTING.md) - Running and writing tests
- [Debugging Guide](docs/DEBUGGING.md) - Backend and frontend debugging

### **Features**
- [Product Bundles](docs/features/PRODUCT_BUNDLES.md) - Bundle/set products
- [Netsis Integration](docs/features/NETSIS_INTEGRATION.md) - Product and stock sync from Netsis ERP
- [Image Processing](docs/features/IMAGE_PROCESSING.md) - Async image handling

### **Deployment**
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Docker Guide](docs/DOCKER.md) - Container management

### **Frontend**
- [Admin Panel Guide](web/docs/ADMIN_PANEL.md) - Admin dashboard usage
- [Design System](web/docs/DESIGN_SYSTEM.md) - UI components and styling

---

## 📁 **Project Structure**

```
Storefront/
├── src/
│   ├── API/
│   │   └── Storefront.Api/              # Main API host
│   ├── Modules/
│   │   ├── Identity/                    # Auth & user management
│   │   ├── Catalog/                     # Products, categories, bundles, Netsis sync
│   │   ├── Content/                     # Blog, pages, SEO
│   │   └── Orders/                      # Guest cart, checkout, payments, admin orders
│   ├── Shared/
│   │   └── Storefront.SharedKernel/     # Result pattern, common types
│   └── Infrastructure/
│       └── Storefront.Infrastructure/   # Cross-cutting concerns
├── tests/
│   ├── Storefront.UnitTests/            # Unit tests
│   ├── Storefront.IntegrationTests/     # API integration tests
│   └── Storefront.ArchitectureTests/    # Architecture validation
├── web/                                 # Next.js storefront + admin panel
├── docker/                              # Docker configs
├── scripts/                             # Database backup/restore
└── docs/                                # Documentation
```

---

## 🔌 **API Reference**

### **Authentication**
```http
POST /api/identity/auth/login      # Login with credentials
POST /api/identity/auth/refresh    # Refresh JWT token
```

### **Products**
```http
GET    /api/catalog/products                           # List/search products
GET    /api/catalog/products/{id}                      # Get product details
POST   /api/catalog/products                           # Create product
PUT    /api/catalog/products/{id}                      # Update product
DELETE /api/catalog/products/{id}                      # Delete product
POST   /api/catalog/products/{id}/images               # Upload image
```

### **Bundles**
```http
GET    /api/catalog/products/{id}/bundle               # Get bundle with components
POST   /api/catalog/products/{id}/components            # Add component to bundle
DELETE /api/catalog/products/{bundleId}/components/{componentId} # Remove component
```

### **Categories**
```http
GET    /api/catalog/categories         # List categories
POST   /api/catalog/categories         # Create category
PUT    /api/catalog/categories/{id}    # Update category
DELETE /api/catalog/categories/{id}    # Delete category
```

### **Guest Cart & Checkout**
```http
GET    /api/cart                       # Get guest cart (X-Guest-Id header)
POST   /api/cart/items                 # Add item to cart
PUT    /api/cart/items/{itemId}        # Update item quantity
DELETE /api/cart/items/{itemId}        # Remove item
POST   /api/cart/checkout              # Create order from cart
```

### **Payments**
```http
POST   /api/b2c/payments/initiate      # Start iyzico payment
POST   /api/b2c/payments/callback      # iyzico payment callback
```

### **Admin Orders**
```http
GET    /api/admin/orders               # List orders
GET    /api/admin/orders/{id}          # Order details
PUT    /api/admin/orders/{id}/status   # Update order status
POST   /api/admin/orders/{id}/comments # Add order comment
```

### **Netsis Integration**
```http
POST   /api/admin/netsis/sync          # Trigger a product + stock sync
```

**Full API documentation:** [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

---

## 🧪 **Testing**

```bash
# Run all tests
dotnet test

# Run specific test project
dotnet test tests/Storefront.UnitTests
dotnet test tests/Storefront.IntegrationTests
dotnet test tests/Storefront.ArchitectureTests

# With coverage
dotnet test /p:CollectCoverage=true
```

**Test Coverage:**
- ✅ Architecture validation (NetArchTest)
- ✅ Domain logic (unit tests)
- ✅ API endpoints (integration tests with Testcontainers)
- ✅ Result pattern and value objects

---

## 🐳 **Docker Deployment**

### **Development**
```bash
docker-compose up -d
```

### **Production**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

**Includes:**
- Multi-stage optimized builds
- Nginx reverse proxy with caching
- Health checks for all services
- Automatic database initialization
- Volume persistence

---

## 📦 **Key Features Explained**

### **Product Bundles**

Create product sets that contain multiple items:

```json
{
  "name": "Living Room Set",
  "productType": "Bundle",
  "bundleItems": [
    { "componentProductId": "sofa-id", "quantity": 1 },
    { "componentProductId": "chair-id", "quantity": 2 }
  ]
}
```

Benefits:
- Sell products individually or as sets
- Calculate bundle pricing automatically or set fixed price
- Show savings to customers
- Track bundle inventory

[Learn more →](docs/features/PRODUCT_BUNDLES.md)

### **Guest Checkout & Payment**

Customers can add products to a cart and check out without creating an account:

```
Browse → Add to Cart → Checkout (delivery details) → iyzico Payment → Order Confirmed
```

The cart is tracked by a guest ID (`X-Guest-Id` header) and converted into an order at checkout.

### **Netsis Integration**

Keeps the catalog in sync with a Netsis ERP instance:

```
Netsis WebService → Product Sync (upsert by SKU) → Stock Sync → Catalog
```

Runs on a schedule or on demand. See [docs/features/NETSIS_INTEGRATION.md](docs/features/NETSIS_INTEGRATION.md) for configuration.

---

## 🛣️ **Roadmap**

### **Phase 1: Catalog Foundation** ✅ **COMPLETE**
- [x] Product management (Simple + Bundles)
- [x] Category management (hierarchical)
- [x] Brand management
- [x] Image processing system
- [x] Search functionality
- [x] Admin dashboard

### **Phase 2: Guest Checkout & Payments** ✅ **COMPLETE**
- [x] Guest cart
- [x] Checkout flow
- [x] iyzico payment integration
- [x] Order status workflow
- [x] Comment system

### **Phase 3: ERP Integration** ✅ **COMPLETE**
- [x] Netsis product sync
- [x] Netsis stock sync
- [x] Scheduled + manual sync

### **Phase 4: Mobile App** 📱 **PLANNED**
- [ ] Browse catalog (React Native / Flutter)
- [ ] Guest checkout
- [ ] Track order status
- [ ] Push notifications

### **Phase 5: Advanced Features** 🔮 **FUTURE**
- [ ] Product variants (fabric/color options)
- [ ] Customer accounts
- [ ] Shipping integrations
- [ ] Analytics dashboard

---

## 📊 **Performance & Scalability**

- **Async Image Processing**: Non-blocking upload handling with Channels
- **Database Indexes**: Optimized queries with GIN trigram indexes
- **Caching**: Nginx-level caching for static assets
- **Lazy Loading**: Server Components + Client Components optimization
- **Background Jobs**: CPU-intensive tasks run in BackgroundService
- **Schema Isolation**: Modules can scale independently

---

## 🔐 **Security**

- ✅ JWT authentication with refresh tokens
- ✅ Role-based authorization (RBAC)
- ✅ HTTP-only cookies for tokens
- ✅ CORS configured
- ✅ Input validation (FluentValidation)
- ✅ SQL injection prevention (EF Core parameterization)
- ✅ Security headers (Nginx)

---

## 🤝 **Contributing**

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### **Development Setup**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### **Code Quality**

- Run tests: `dotnet test`
- Check architecture rules: `dotnet test tests/Storefront.ArchitectureTests`
- Follow existing patterns (CQRS, Result pattern)
- Add tests for new features

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 **Support**

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)

---

## 🙏 **Acknowledgments**

Built with:
- [.NET](https://dotnet.microsoft.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [MediatR](https://github.com/jbogard/MediatR)
- [ImageSharp](https://sixlabors.com/products/imagesharp/)
- [Iyzipay](https://www.iyzico.com/)

---

## 🚀 **Quick Links**

- 📚 [Full Documentation](docs/)
- 🔌 [API Reference](docs/API_REFERENCE.md)
- 🎨 [Design System](web/docs/DESIGN_SYSTEM.md)
- 🐳 [Docker Guide](docs/DOCKER.md)
- 🧪 [Testing Guide](docs/TESTING.md)
- 🚀 [Deployment Guide](docs/DEPLOYMENT.md)
