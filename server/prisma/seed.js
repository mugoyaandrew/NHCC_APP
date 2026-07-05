const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const departments = ['OPERATIONS', 'ENGINEERING', 'FINANCE', 'HR', 'ICT', 'PROCUREMENT', 'LAW', 'PIU'];
const roles = ['CEO', 'DEPUTY_CEO', 'CAO', 'HR', 'PROCUREMENT', 'ICT', 'ENGINEERING', 'FINANCE', 'OPERATIONS', 'LAW', 'PIU', 'STAFF', 'INTERN'];
const districts = ['Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Mbale', 'Gulu', 'Lira', 'Mbarara', 'Arua', 'Fort Portal', 'Masaka', 'Hoima', 'Soroti', 'Mityana', 'Entebbe'];
const ugandanNames = ['James Mukasa', 'Sarah Nakamya', 'David Ochieng', 'Grace Auma', 'Peter Ssempala', 'Mary Nalubega', 'John Kato', 'Rita Nambi', 'Joseph Okello', 'Aisha Namutebi', 'Daniel Kiggundu', 'Agnes Akello', 'Samuel Byaruhanga', 'Esther Nanyonga'];
const suppliers = ['Mukwano Builders Ltd', 'Roko Construction', 'Roofings Uganda', 'Steel & Tube Industries', 'Uganda Clays', 'Hima Cement', 'National Water Works', 'Kiira Electricals', 'Pearl Logistics', 'Nile Procurement Services'];

const englishSentences = [
  'Please review the attached documents for the upcoming phase.',
  'Site inspection completed with minor issues noted.',
  'Awaiting approval from the finance department.',
  'Procurement for raw materials is on schedule.',
  'The contractor has requested a timeline extension.',
  'Foundation work is progressing faster than expected.',
  'Safety briefing conducted for all new site workers.',
  'Pending review of the latest architectural blueprints.',
  'Quality assurance checks passed for the first floor.',
  'Initial site survey completed successfully.'
];

const taskDescriptions = [
  'Conduct structural analysis of the main supporting pillars.',
  'Review and finalize the supplier contracts for Q3.',
  'Ensure all safety protocols are being followed on site.',
  'Update the project timeline and notify stakeholders.',
  'Coordinate with the logistics team for material delivery.'
];

const messageContents = [
  'Can we schedule a meeting to discuss the budget overruns?',
  'I have uploaded the revised site plans to the shared folder.',
  'Please approve the latest invoice from the steel supplier.',
  'Just a reminder that the site inspection is tomorrow at 9 AM.',
  'The client has requested some changes to the exterior finishing.'
];

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function futureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const { faker } = await import('@faker-js/faker');
  const hash = bcrypt.hashSync('password123', 10);

  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { isSynthetic: true } }),
    prisma.calendarEvent.deleteMany({ where: { isSynthetic: true } }),
    prisma.invoice.deleteMany({ where: { isSynthetic: true } }),
    prisma.contract.deleteMany({ where: { isSynthetic: true } }),
    prisma.procurementRecord.deleteMany({ where: { isSynthetic: true } }),
    prisma.message.deleteMany({ where: { isSynthetic: true } }),
    prisma.announcement.deleteMany({ where: { isSynthetic: true } }),
    prisma.siteReport.deleteMany({ where: { isSynthetic: true } }),
    prisma.approval.deleteMany({ where: { isSynthetic: true } }),
    prisma.document.deleteMany({ where: { isSynthetic: true } }),
    prisma.task.deleteMany({ where: { isSynthetic: true } }),
    prisma.project.deleteMany({ where: { isSynthetic: true } }),
    prisma.department.deleteMany({ where: { isSynthetic: true } }),
  ]);

  for (const department of departments) {
    await prisma.department.upsert({
      where: { name: department },
      update: {},
      create: { name: department, headRole: department, site: pick(districts), isSynthetic: true },
    });
  }

  const baseUsers = [
    ['admin@nhcc.go.ug', 'James Mukasa', 'CEO', 'OPERATIONS'],
    ['deputy@nhcc.go.ug', 'Rebecca Nansubuga', 'DEPUTY_CEO', 'OPERATIONS'],
    ['cao@nhcc.go.ug', 'Charles Wamala', 'CAO', 'OPERATIONS'],
    ['eng@nhcc.go.ug', 'Sarah Nakamya', 'ENGINEERING', 'ENGINEERING'],
    ['finance@nhcc.go.ug', 'David Ochieng', 'FINANCE', 'FINANCE'],
    ['hr@nhcc.go.ug', 'Grace Auma', 'HR', 'HR'],
    ['ict@nhcc.go.ug', 'Peter Ssempala', 'ICT', 'ICT'],
    ['procurement@nhcc.go.ug', 'Mary Nalubega', 'PROCUREMENT', 'PROCUREMENT'],
    ['ops@nhcc.go.ug', 'John Kato', 'OPERATIONS', 'OPERATIONS'],
    ['law@nhcc.go.ug', 'Judith Alupo', 'LAW', 'LAW'],
    ['piu@nhcc.go.ug', 'Moses Kabanda', 'PIU', 'PIU'],
    ['intern@nhcc.go.ug', 'Rita Nambi', 'INTERN', 'ENGINEERING'],
    ['demo@finara.app', 'Demo User', 'STAFF', 'OPERATIONS'],
  ];

  for (const [email, fullName, role, department] of baseUsers) {
    await prisma.user.upsert({
      where: { email },
      update: { fullName, role, department, passwordHash: hash, isActive: true },
      create: { email, fullName, role, department, passwordHash: hash, isActive: true },
    });
  }

  const users = await prisma.user.findMany();
  const managerIds = users.filter((u) => roles.includes(u.role)).map((u) => u.id);

  for (let i = 0; i < 40; i += 1) {
    const name = `${pick(ugandanNames).split(' ')[0]}.${i}@nhcc.go.ug`.toLowerCase();
    await prisma.user.upsert({
      where: { email: name },
      update: {},
      create: {
        email: name,
        fullName: `${pick(ugandanNames).split(' ')[0]} ${faker.person.lastName()}`,
        passwordHash: hash,
        role: i % 8 === 0 ? pick(roles.slice(3, 11)) : 'STAFF',
        department: pick(departments),
        isActive: true,
      },
    });
  }

  const createdProjects = [];
  for (let i = 0; i < 110; i += 1) {
    const district = pick(districts);
    const budget = faker.number.int({ min: 800_000_000, max: 65_000_000_000 });
    const completion = faker.number.int({ min: 0, max: 100 });
    const spent = Math.round(budget * (completion / 100) * faker.number.float({ min: 0.75, max: 1.15 }));
    const project = await prisma.project.create({
      data: {
        name: `${district} ${pick(['Housing Estate', 'Market Redevelopment', 'Staff Apartments', 'Office Complex', 'Affordable Homes'])} ${i + 1}`,
        description: faker.company.catchPhrase(),
        status: pick(['planning', 'in_progress', 'in_progress', 'under_review', 'on_hold']),
        ragStatus: completion < 25 ? pick(['green', 'amber']) : pick(['green', 'amber', 'red']),
        location: district,
        site: district,
        department: pick(['ENGINEERING', 'PIU', 'OPERATIONS']),
        budget,
        spent,
        completion,
        startDate: futureDate(-faker.number.int({ min: 20, max: 900 })),
        endDate: futureDate(faker.number.int({ min: 30, max: 900 })),
        managerId: pick(managerIds),
        isSynthetic: true,
      },
    });
    createdProjects.push(project);
  }

  const staff = await prisma.user.findMany();
  for (let i = 0; i < 560; i += 1) {
    const project = pick(createdProjects);
    await prisma.task.create({
      data: {
        projectId: project.id,
        title: `${pick(['Foundation', 'Procurement', 'Inspection', 'MEP', 'Roofing', 'Finishing', 'Survey'])} ${pick(['Phase 1', 'Review', 'Updates', 'Check', 'Preparation', 'Finalization'])}`,
        description: pick(taskDescriptions),
        status: pick(['backlog', 'in_progress', 'under_review', 'done', 'blocked']),
        priority: pick(['critical', 'high', 'medium', 'low']),
        assigneeId: pick(staff).id,
        dueDate: futureDate(faker.number.int({ min: -30, max: 120 })),
        department: project.department,
        isSynthetic: true,
      },
    });
  }

  for (let i = 0; i < 240; i += 1) {
    const project = pick(createdProjects);
    await prisma.document.create({
      data: {
        title: `${project.name} ${pick(['Contract', 'Site Report', 'Drawing', 'Tender', 'Financial Statement'])}`,
        type: pick(['contract', 'tender', 'drawing', 'report', 'financial', 'legal', 'policy', 'site_photo']),
        projectId: project.id,
        filePath: `/docs/synthetic-${i}.pdf`,
        fileSize: faker.number.int({ min: 60_000, max: 25_000_000 }),
        uploadedBy: pick(staff).id,
        expiryDate: futureDate(faker.number.int({ min: 7, max: 540 })),
        department: pick(departments),
        isSynthetic: true,
      },
    });
  }

  for (let i = 0; i < 120; i += 1) {
    const project = pick(createdProjects);
    await prisma.procurementRecord.create({
      data: {
        title: `${pick(['Cement', 'Steel', 'Roofing sheets', 'Electrical fittings', 'Plumbing materials'])} procurement`,
        supplier: pick(suppliers),
        category: pick(['materials', 'equipment', 'professional_services', 'transport']),
        amount: faker.number.int({ min: 5_000_000, max: 2_500_000_000 }),
        status: pick(['draft', 'advertised', 'evaluation', 'awarded', 'delivered']),
        projectId: project.id,
        isSynthetic: true,
      },
    });

    await prisma.contract.create({
      data: {
        title: `${project.name} supplier agreement`,
        party: pick(suppliers),
        value: faker.number.int({ min: 20_000_000, max: 4_000_000_000 }),
        status: pick(['active', 'review', 'expired', 'signed']),
        startDate: futureDate(-faker.number.int({ min: 10, max: 360 })),
        expiryDate: futureDate(faker.number.int({ min: 14, max: 720 })),
        projectId: project.id,
        isSynthetic: true,
      },
    });

    await prisma.invoice.create({
      data: {
        number: `NHCC-${Date.now()}-${i}`,
        supplier: pick(suppliers),
        amount: faker.number.int({ min: 2_000_000, max: 900_000_000 }),
        status: pick(['pending', 'approved', 'paid', 'rejected']),
        dueDate: futureDate(faker.number.int({ min: -10, max: 90 })),
        projectId: project.id,
        isSynthetic: true,
      },
    });
  }

  for (let i = 0; i < 180; i += 1) {
    const project = pick(createdProjects);
    await prisma.siteReport.create({
      data: {
        projectId: project.id,
        date: futureDate(-faker.number.int({ min: 0, max: 120 })),
        weather: pick(['sunny', 'cloudy', 'rainy']),
        manpower: faker.number.int({ min: 12, max: 260 }),
        completion: project.completion,
        workDone: pick(englishSentences),
        materials: `${pick(['cement', 'steel', 'sand', 'aggregate'])}: ${faker.number.int({ min: 10, max: 800 })} units`,
        issues: faker.helpers.maybe(() => pick(englishSentences), { probability: 0.35 }) || 'None reported',
        reportedBy: pick(staff).id,
        site: project.site,
        isSynthetic: true,
      },
    });
  }

  for (let i = 0; i < 150; i += 1) {
    await prisma.approval.create({
      data: {
        title: `${pick(['Budget', 'Procurement', 'Contract', 'HR', 'Travel'])} approval ${i + 1}`,
        type: pick(['budget', 'procurement', 'contract', 'hr', 'travel']),
        description: pick(englishSentences),
        requestedBy: pick(staff).id,
        status: pick(['pending', 'approved', 'rejected', 'returned']),
        reviewedBy: faker.helpers.maybe(() => pick(staff).id, { probability: 0.6 }) || null,
        department: pick(departments),
        isSynthetic: true,
      },
    });
  }

  for (let i = 0; i < 220; i += 1) {
    await prisma.message.create({
      data: {
        senderId: pick(staff).id,
        recipientId: faker.helpers.maybe(() => pick(staff).id, { probability: 0.7 }) || null,
        subject: pick(['Site update', 'Procurement clarification', 'Approval follow-up', 'Inspection notes']),
        content: pick(messageContents),
        channel: pick(['site-kampala', 'engineering', 'procurement-engineering', 'finance-approvals']),
        isSynthetic: true,
      },
    });
  }

  for (let i = 0; i < 160; i += 1) {
    const startsAt = faker.date.soon({ days: 45 });
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    await prisma.calendarEvent.create({
      data: {
        title: `${pick(['Board meeting', 'Site inspection', 'Tender deadline', 'Department meeting', 'Contract review'])}`,
        type: pick(['board_meeting', 'site_inspection', 'tender_deadline', 'department_meeting', 'contract_expiry']),
        startsAt,
        endsAt,
        department: pick(departments),
        site: pick(districts),
        projectId: pick(createdProjects).id,
        isSynthetic: true,
      },
    });
  }

  for (let i = 0; i < 180; i += 1) {
    await prisma.notification.create({
      data: {
        userId: pick(staff).id,
        title: pick(['Task assigned', 'Approval required', 'Contract expiring', 'Budget threshold reached', 'New site report']),
        body: pick(englishSentences),
        type: pick(['task', 'approval', 'contract', 'budget', 'site_report']),
        isSynthetic: true,
      },
    });
  }

  await prisma.reportSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, recipients: 'ceo@nhcc.go.ug, deputy@nhcc.go.ug', enabled: true },
  });

  console.log('Seed complete: NHCC enterprise synthetic dataset generated.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
