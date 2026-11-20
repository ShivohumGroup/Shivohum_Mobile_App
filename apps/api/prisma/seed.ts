/**
 * Development seed only — NEVER use these credentials in production.
 *
 * Admin: admin@siteflow.local / SiteFlow@Admin123
 * Partner: partner@siteflow.local / SiteFlow@Partner123
 * Manager: manager@siteflow.local / SiteFlow@Manager123
 * Viewer: viewer@siteflow.local / SiteFlow@Viewer123
 */
import { PrismaClient, ProjectStatus, ProjectType, PaymentMethod, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { DEFAULT_EXPENSE_CATEGORIES } from '@siteflow/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SiteFlow development data...');

  await prisma.expensePayment.deleteMany();
  await prisma.incomeTransaction.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.progressPhoto.deleteMany();
  await prisma.progressUpdate.deleteMany();
  await prisma.contactSite.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.siteMembership.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.client.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.site.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: {
      name: 'Shivohum Constructions',
      code: 'SHIVOHUM',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
    },
  });

  const adminHash = await argon2.hash('SiteFlow@Admin123', { type: argon2.argon2id });
  const partnerHash = await argon2.hash('SiteFlow@Partner123', { type: argon2.argon2id });
  const managerHash = await argon2.hash('SiteFlow@Manager123', { type: argon2.argon2id });
  const viewerHash = await argon2.hash('SiteFlow@Viewer123', { type: argon2.argon2id });

  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@siteflow.local',
      passwordHash: adminHash,
      fullName: 'SiteFlow Admin',
      phone: '+919876543210',
      role: UserRole.ADMIN,
    },
  });

  const partner = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'partner@siteflow.local',
      passwordHash: partnerHash,
      fullName: 'Business Partner',
      role: UserRole.PARTNER,
    },
  });

  const manager = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'manager@siteflow.local',
      passwordHash: managerHash,
      fullName: 'Site Manager',
      role: UserRole.SITE_MANAGER,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'viewer@siteflow.local',
      passwordHash: viewerHash,
      fullName: 'Read Only Viewer',
      role: UserRole.VIEWER,
    },
  });

  const categories = [];
  for (let i = 0; i < DEFAULT_EXPENSE_CATEGORIES.length; i++) {
    const cat = await prisma.expenseCategory.create({
      data: {
        organizationId: org.id,
        name: DEFAULT_EXPENSE_CATEGORIES[i],
        sortOrder: i,
      },
    });
    categories.push(cat);
  }

  const siteDefs = [
    {
      name: 'Residential Project A',
      code: 'RES-A',
      clientName: 'Mr. Sharma',
      clientPhone: '+919811111111',
      address: '12 Palm Grove, Baner',
      city: 'Pune',
      state: 'Maharashtra',
      projectType: ProjectType.RESIDENTIAL,
      contractAmount: '2500000.00',
      status: ProjectStatus.ACTIVE,
    },
    {
      name: 'Commercial Project B',
      code: 'COM-B',
      clientName: 'TechPark Pvt Ltd',
      clientPhone: '+919822222222',
      address: 'Plot 8, Hinjewadi Phase 2',
      city: 'Pune',
      state: 'Maharashtra',
      projectType: ProjectType.COMMERCIAL,
      contractAmount: '8500000.00',
      status: ProjectStatus.ACTIVE,
    },
    {
      name: 'Residential Project C',
      code: 'RES-C',
      clientName: 'Mrs. Patel',
      clientPhone: '+919833333333',
      address: '45 Lakeview Society, Wakad',
      city: 'Pune',
      state: 'Maharashtra',
      projectType: ProjectType.RESIDENTIAL,
      contractAmount: '1800000.00',
      status: ProjectStatus.PLANNING,
    },
    {
      name: 'Interior Project D',
      code: 'INT-D',
      clientName: 'Kapoor Interiors Client',
      clientPhone: '+919844444444',
      address: '7 Orchid Towers, Kalyani Nagar',
      city: 'Pune',
      state: 'Maharashtra',
      projectType: ProjectType.INTERIOR,
      contractAmount: '950000.00',
      status: ProjectStatus.ACTIVE,
    },
  ];

  const sites = [];
  for (const def of siteDefs) {
    const site = await prisma.site.create({
      data: {
        organizationId: org.id,
        ...def,
        description: `${def.name} managed via SiteFlow`,
        agreedStartDate: new Date('2025-01-15'),
        expectedCompletionDate: new Date('2026-06-30'),
        projectManagerId: manager.id,
        createdById: admin.id,
      },
    });
    sites.push(site);

    for (const u of [admin, partner, manager]) {
      await prisma.siteMembership.create({
        data: {
          organizationId: org.id,
          siteId: site.id,
          userId: u.id,
          role: u.role,
          canViewFinance: true,
          canEditFinance: u.role !== UserRole.VIEWER,
          canEditProgress: true,
          canEditContacts: true,
        },
      });
    }
  }

  // Viewer only on site A
  await prisma.siteMembership.create({
    data: {
      organizationId: org.id,
      siteId: sites[0].id,
      userId: viewer.id,
      role: UserRole.VIEWER,
      canViewFinance: true,
      canEditFinance: false,
      canEditProgress: false,
      canEditContacts: false,
    },
  });

  // Contacts
  const furnitureContact = await prisma.contact.create({
    data: {
      organizationId: org.id,
      personName: 'Ramesh Kumar',
      companyName: 'ABC Furniture',
      workCategory: 'Furniture',
      designation: 'Contractor',
      primaryPhone: '+919900112233',
      whatsappNumber: '+919900112233',
      createdById: admin.id,
      sites: { create: [{ siteId: sites[0].id }, { siteId: sites[3].id }] },
    },
  });

  await prisma.contact.create({
    data: {
      organizationId: org.id,
      personName: 'Suresh Electricals',
      companyName: 'Bright Electric Co',
      workCategory: 'Electrical',
      primaryPhone: '+919911223344',
      createdById: manager.id,
      sites: { create: [{ siteId: sites[1].id }] },
    },
  });

  // Income — Site A partial payments
  await prisma.incomeTransaction.createMany({
    data: [
      {
        organizationId: org.id,
        siteId: sites[0].id,
        amount: '500000.00',
        dateReceived: new Date('2025-02-10'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        referenceNumber: 'NEFT-A-001',
        description: 'Advance payment',
        createdById: admin.id,
      },
      {
        organizationId: org.id,
        siteId: sites[0].id,
        amount: '750000.00',
        dateReceived: new Date('2025-06-15'),
        paymentMethod: PaymentMethod.UPI,
        referenceNumber: 'UPI-A-002',
        description: 'Milestone 2',
        createdById: admin.id,
      },
      {
        organizationId: org.id,
        siteId: sites[1].id,
        amount: '2000000.00',
        dateReceived: new Date('2025-03-01'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        description: 'Mobilization advance',
        createdById: admin.id,
      },
      {
        organizationId: org.id,
        siteId: sites[3].id,
        amount: '300000.00',
        dateReceived: new Date('2025-04-20'),
        paymentMethod: PaymentMethod.CASH,
        description: 'Initial payment',
        createdById: partner.id,
      },
    ],
  });

  // Expenses with partial payments
  const labourCat = categories.find((c) => c.name === 'Labour')!;
  const furnitureCat = categories.find((c) => c.name === 'Furniture')!;
  const materialsCat = categories.find((c) => c.name === 'Building materials')!;

  const expenseA1 = await prisma.expense.create({
    data: {
      organizationId: org.id,
      siteId: sites[0].id,
      categoryId: labourCat.id,
      vendorName: 'Local Labour Contractor',
      amount: '200000.00',
      amountPaid: '100000.00',
      expenseDate: new Date('2025-03-05'),
      paymentStatus: 'PARTIALLY_PAID',
      paymentMethod: PaymentMethod.CASH,
      description: 'Foundation labour',
      createdById: manager.id,
    },
  });
  await prisma.expensePayment.create({
    data: {
      organizationId: org.id,
      expenseId: expenseA1.id,
      amount: '100000.00',
      paidAt: new Date('2025-03-05'),
      paymentMethod: PaymentMethod.CASH,
      createdById: manager.id,
    },
  });

  const expenseA2 = await prisma.expense.create({
    data: {
      organizationId: org.id,
      siteId: sites[0].id,
      categoryId: furnitureCat.id,
      vendorName: 'ABC Furniture',
      contactId: furnitureContact.id,
      amount: '350000.00',
      amountPaid: '350000.00',
      expenseDate: new Date('2025-05-12'),
      paymentStatus: 'PAID',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      description: 'Living room furniture',
      createdById: admin.id,
    },
  });
  await prisma.expensePayment.create({
    data: {
      organizationId: org.id,
      expenseId: expenseA2.id,
      amount: '350000.00',
      paidAt: new Date('2025-05-12'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      createdById: admin.id,
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: org.id,
      siteId: sites[1].id,
      categoryId: materialsCat.id,
      vendorName: 'Steel & Cement Traders',
      amount: '800000.00',
      amountPaid: '0.00',
      expenseDate: new Date('2025-04-01'),
      paymentStatus: 'UNPAID',
      description: 'Structural materials — unpaid bill',
      createdById: manager.id,
    },
  });

  // Progress updates
  await prisma.progressUpdate.createMany({
    data: [
      {
        organizationId: org.id,
        siteId: sites[0].id,
        updateDate: new Date('2025-06-01'),
        title: 'Plastering completed on ground floor',
        description: 'Internal plastering finished. Electrical conduits in progress.',
        workCategory: 'POP',
        completedWork: 'Ground floor plaster',
        workInProgress: 'Electrical first fix',
        nextDayPlan: 'Start first-floor plumbing',
        completionPercent: 45,
        createdById: manager.id,
      },
      {
        organizationId: org.id,
        siteId: sites[1].id,
        updateDate: new Date('2025-06-10'),
        title: 'Column casting for wing B',
        description: 'Completed casting for 8 columns. Curing ongoing.',
        workCategory: 'Building materials',
        completionPercent: 30,
        createdById: manager.id,
      },
      {
        organizationId: org.id,
        siteId: sites[3].id,
        updateDate: new Date('2025-06-15'),
        title: 'Modular kitchen measurement',
        description: 'Site measurement done with ABC Furniture team.',
        workCategory: 'Furniture',
        completionPercent: 20,
        createdById: partner.id,
      },
    ],
  });

  await prisma.activityLog.create({
    data: {
      organizationId: org.id,
      actorId: admin.id,
      type: 'SITE_CREATED',
      summary: 'Organization seeded with four example sites',
    },
  });

  console.log('Seed complete.');
  console.log('Login: admin@siteflow.local / SiteFlow@Admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
