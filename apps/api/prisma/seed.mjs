import { hash } from 'bcryptjs';
import {
  InventoryTransactionType,
  PrismaClient,
  ProductStatus,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();
const password = await hash('Demo1234', 12);

const seller = await prisma.user.upsert({
  where: { email: 'seller@choviet.local' },
  update: { passwordHash: password, role: UserRole.SELLER, status: 'ACTIVE' },
  create: {
    email: 'seller@choviet.local',
    passwordHash: password,
    name: 'Gian hàng Đất Việt',
    phone: '0901234567',
    role: UserRole.SELLER,
  },
});
const buyer = await prisma.user.upsert({
  where: { email: 'buyer@choviet.local' },
  update: { passwordHash: password, role: UserRole.BUYER, status: 'ACTIVE' },
  create: {
    email: 'buyer@choviet.local',
    passwordHash: password,
    name: 'Nguyễn An',
    phone: '0912345678',
    role: UserRole.BUYER,
  },
});

const store = await prisma.store.upsert({
  where: { sellerId: seller.id },
  update: { name: 'Đất Việt', slug: 'dat-viet', status: 'ACTIVE' },
  create: {
    name: 'Đất Việt',
    slug: 'dat-viet',
    description: 'Đặc sản và đồ dùng từ các vùng miền.',
    sellerId: seller.id,
  },
});

const categories = [
  ['Thực phẩm', 'thuc-pham'],
  ['Thời trang', 'thoi-trang'],
  ['Nhà cửa', 'nha-cua'],
  ['Làm đẹp', 'lam-dep'],
  ['Điện tử', 'dien-tu'],
  ['Đặc sản', 'dac-san'],
  ['Thủ công', 'thu-cong'],
];
const categoryId = {};
for (const [name, slug] of categories) {
  const row = await prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
  categoryId[slug] = row.id;
}

const photoRules = [
  ['gạo', '/products/gao-st25.jpg'],
  ['gao', '/products/gao-st25.jpg'],
  ['nếp', '/products/gao-st25.jpg'],
  ['tôm khô', '/products/tom-kho.jpg'],
  ['tom kho', '/products/tom-kho.jpg'],
  ['mì quảng', '/products/mi-quang.jpg'],
  ['mi quang', '/products/mi-quang.jpg'],
  ['bún', '/products/mi-quang.jpg'],
  ['dầu phụng', '/products/dau-phung.jpg'],
  ['dau phung', '/products/dau-phung.jpg'],
  ['dầu dừa', '/products/dau-dua.jpg'],
  ['dau dua', '/products/dau-dua.jpg'],
  ['cà phê', '/products/ca-phe.jpg'],
  ['ca phe', '/products/ca-phe.jpg'],
  ['nước mắm', '/products/nuoc-mam.jpg'],
  ['nuoc mam', '/products/nuoc-mam.jpg'],
  ['mật ong', '/products/mat-ong.jpg'],
  ['mat ong', '/products/mat-ong.jpg'],
  ['bánh pía', '/products/banh-pia.jpg'],
  ['banh pia', '/products/banh-pia.jpg'],
  ['áo dài', '/products/ao-dai.jpg'],
  ['ao dai', '/products/ao-dai.jpg'],
  ['nón', '/products/non-la.jpg'],
  ['non', '/products/non-la.jpg'],
  ['khăn', '/products/khan-lua.jpg'],
  ['khan', '/products/khan-lua.jpg'],
  ['nồi đất', '/products/noi-dat.jpg'],
  ['noi dat', '/products/noi-dat.jpg'],
  ['đũa', '/products/dua-tre.jpg'],
  ['dua tre', '/products/dua-tre.jpg'],
  ['ấm trà', '/products/am-tra.jpg'],
  ['am tra', '/products/am-tra.jpg'],
  ['son', '/products/son-moi.jpg'],
  ['tinh dầu', '/products/tinh-dau-sa.jpg'],
  ['tinh dau', '/products/tinh-dau-sa.jpg'],
  ['tai nghe', '/products/tai-nghe.jpg'],
  ['loa', '/products/loa-bluetooth.jpg'],
  ['sạc', '/products/sac-du-phong.jpg'],
  ['sac du', '/products/sac-du-phong.jpg'],
  ['giỏ', '/products/gio-may.jpg'],
  ['gio may', '/products/gio-may.jpg'],
  ['mây', '/products/gio-may.jpg'],
  ['may', '/products/gio-may.jpg'],
  ['cói', '/products/gio-may.jpg'],
  ['coi', '/products/gio-may.jpg'],
  ['tre', '/products/gio-may.jpg'],
  ['thìa', '/products/dua-tre.jpg'],
  ['thia', '/products/dua-tre.jpg'],
  ['lược', '/products/dua-tre.jpg'],
  ['luoc', '/products/dua-tre.jpg'],
  ['khung', '/products/tuong-go.jpg'],
  ['đèn lồng', '/products/den-long.jpg'],
  ['den long', '/products/den-long.jpg'],
  ['tượng', '/products/tuong-go.jpg'],
  ['tuong', '/products/tuong-go.jpg'],
];

const photoPool = {
  'thuc-pham': ['/products/gao-st25.jpg', '/products/tom-kho.jpg', '/products/mi-quang.jpg', '/products/dau-phung.jpg'],
  'thoi-trang': ['/products/ao-dai.jpg', '/products/non-la.jpg', '/products/khan-lua.jpg'],
  'nha-cua': ['/products/noi-dat.jpg', '/products/dua-tre.jpg', '/products/am-tra.jpg'],
  'lam-dep': ['/products/son-moi.jpg', '/products/dau-dua.jpg', '/products/tinh-dau-sa.jpg'],
  'dien-tu': ['/products/tai-nghe.jpg', '/products/loa-bluetooth.jpg', '/products/sac-du-phong.jpg'],
  'dac-san': ['/products/ca-phe.jpg', '/products/nuoc-mam.jpg', '/products/mat-ong.jpg', '/products/banh-pia.jpg'],
  'thu-cong': ['/products/gio-may.jpg', '/products/den-long.jpg', '/products/tuong-go.jpg'],
};

function photoFor(name, category, index) {
  const haystack = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
  const hit = photoRules.find(([keyword]) => haystack.includes(keyword));
  if (hit) return hit[1];
  const pool = photoPool[category] ?? photoPool['thuc-pham'];
  return pool[index % pool.length];
}

const namesByCategory = {
  'thuc-pham': [
    'Gạo ST25 túi 5kg', 'Tôm khô Cà Mau 200g', 'Mì Quảng khô 500g', 'Dầu phụng nguyên chất 500ml',
    'Nếp cái hoa vàng 2kg', 'Đậu xanh cà 500g', 'Hạt sen sấy 200g', 'Mè rang 250g',
    'Bột gạo 1kg', 'Nước tương 500ml', 'Dưa món Huế 400g', 'Ruốc tôm 150g',
    'Khô cá lóc 200g', 'Bún khô Quảng Ngãi 500g', 'Bánh tráng Mỹ Lồng', 'Muối tôm Tây Ninh 100g',
    'Tương ớt homemade 250ml', 'Chả lụa 500g', 'Giò thủ 400g', 'Hành phi 100g',
  ],
  'thoi-trang': [
    'Áo dài lụa tơ tằm', 'Nón lá Huế', 'Khăn lụa Hà Đông', 'Áo bà ba nam',
    'Áo bà ba nữ', 'Quần đũi Hà Đông', 'Áo linen tay lỡ', 'Váy đũi thêu',
    'Khăn rằn Nam Bộ', 'Dép tổ ong', 'Guốc mộc', 'Áo tứ thân',
    'Yếm đào', 'Áo khoác kaki', 'Nón tai bèo', 'Túi vải thô',
    'Thắt lưng da bò', 'Tất cotton 5 đôi', 'Áo sơ mi đũi', 'Khăn choàng len',
  ],
  'nha-cua': [
    'Nồi đất kho cá', 'Bộ đũa tre 10 đôi', 'Ấm trà Bát Tràng', 'Chén cơm Bát Tràng',
    'Đĩa sứ men rạn', 'Thớt gỗ nghiến', 'Dao nhà bếp', 'Rổ tre',
    'Rế lót nồi', 'Khăn lau bếp', 'Hũ gạo sành', 'Hộp đựng gia vị',
    'Chảo gang', 'Nồi cơm 1.8L', 'Ly sứ trắng', 'Bình thủy tinh 1L',
    'Khay gỗ', 'Giá úp bát', 'Chổi đót', 'Thảm cói',
  ],
  'lam-dep': [
    'Son môi handmade', 'Dầu dừa Bến Tre 250ml', 'Tinh dầu sả chanh 10ml', 'Sữa rửa mặt gạo',
    'Kem dưỡng gấc', 'Mặt nạ đất sét', 'Toner nha đam', 'Serum vitamin C',
    'Dầu gội bồ kết', 'Dầu xả dừa', 'Tẩy tế bào chết cà phê', 'Son dưỡng gấc',
    'Phấn nén gạo', 'Chì kẻ mày', 'Nước hoa sả', 'Muối tắm thảo mộc',
    'Xà bông thiên nhiên', 'Kem chống nắng SPF50', 'Mascara than tre', 'Tinh dầu tràm 10ml',
  ],
  'dien-tu': [
    'Tai nghe không dây', 'Loa bluetooth mini', 'Sạc dự phòng 10000mAh', 'Cáp USB-C 1m',
    'Củ sạc 20W', 'Chuột không dây', 'Bàn phím mini', 'Đế tản nhiệt laptop',
    'USB 64GB', 'Ổ cứng di động 1TB', 'Webcam HD', 'Micro cài áo',
    'Đèn LED kẹp', 'Hub USB 4 cổng', 'Tai nghe chụp tai', 'Loa soundbar mini',
    'Đồng hồ thông minh', 'Vòng đeo tay sức khỏe', 'Ổ cắm thông minh', 'Bóng đèn WiFi',
  ],
  'dac-san': [
    'Cà phê rang xay Đà Lạt 500g', 'Nước mắm Phú Quốc 500ml', 'Mật ong rừng nguyên chất 500ml', 'Bánh pía Sóc Trăng',
    'Chả cá Nha Trang', 'Nem chua Thanh Hóa', 'Mắm tôm Bắc', 'Ô mai Hà Nội',
    'Kẹo dừa Bến Tre', 'Me sấy 200g', 'Hạt điều Bình Phước', 'Tiêu đen Phú Quốc',
    'Quế Trà My', 'Trà sen Tây Hồ', 'Chè Thái Nguyên', 'Rượu nếp cái',
    'Bánh đậu xanh Hải Dương', 'Sầu riêng sấy', 'Mít sấy Đà Lạt', 'Khoai lang tím sấy',
  ],
  'thu-cong': [
    'Giỏ mây thủ công', 'Đèn lồng Hội An', 'Tượng gỗ trâu', 'Tranh dân gian Đông Hồ',
    'Thảm cói bàn', 'Túi cói', 'Khay mây', 'Lọ hoa gốm',
    'Gốm sứ men lam', 'Tranh thêu tay', 'Quạt giấy', 'Trúc chỉ Huế',
    'Hộp tre', 'Gương gỗ', 'Chuông gió', 'Vòng tay gỗ trầm',
    'Lược sừng', 'Đĩa mây', 'Khung ảnh gỗ', 'Thìa gỗ',
  ],
};

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const skuPrefix = {
  'thuc-pham': 'TP',
  'thoi-trang': 'TT',
  'nha-cua': 'NC',
  'lam-dep': 'LD',
  'dien-tu': 'DT',
  'dac-san': 'DS',
  'thu-cong': 'TC',
};

const careByCategory = {
  'thuc-pham': 'Bảo quản nơi khô ráo, đậy kín sau khi mở và dùng trong 30 ngày.',
  'dac-san': 'Bảo quản ngăn mát, tránh nắng trực tiếp, dùng trong 20 ngày sau khi mở.',
  'nha-cua': 'Tráng nước ấm trước khi dùng, tránh va đập mạnh và lau khô sau khi rửa.',
  'thoi-trang': 'Giặt tay nước lạnh, phơi trong bóng râm để giữ màu và form.',
  'do-uong': 'Đậy kín, để nơi thoáng mát; pha xong dùng ngay để giữ hương.',
  'thu-cong': 'Treo nơi khô, tránh ẩm lâu ngày để giữ form.',
  'lam-dep': 'Để nơi thoáng, tránh nắng; ngừng dùng nếu da kích ứng.',
  'dien-tu': 'Giữ khô, dùng đúng nguồn điện và cất hộp khi không dùng.',
};

function describe(name, category) {
  const care = careByCategory[category] ?? 'Bảo quản nơi khô ráo, tránh nắng trực tiếp.';
  return [
    `${name} do gian hàng Đất Việt tuyển chọn và đóng gói trong ngày.`,
    care,
    'Mọi thắc mắc về lô hàng, nhắn cho nhà bán ngay trên trang sản phẩm.',
  ].join('\n\n');
}

const products = [];
for (const [category, names] of Object.entries(namesByCategory)) {
  names.forEach((name, index) => {
    const price = 45000 + index * 11000 + category.length * 3000;
    products.push({
      name,
      slug: slugify(name),
      sku: `SKU-C20-${skuPrefix[category]}-${String(index + 1).padStart(2, '0')}`,
      price,
      compareAtPrice: index % 3 === 0 ? price + 30000 : null,
      stock: 24 + ((index * 7) % 48),
      category,
      image: photoFor(name, category, index),
      description: describe(name, category),
    });
  });
}

const seenSlug = new Set();
const seenSku = new Set();
for (const product of products) {
  if (seenSlug.has(product.slug) || seenSku.has(product.sku)) {
    throw new Error(`duplicate ${product.slug} ${product.sku}`);
  }
  seenSlug.add(product.slug);
  seenSku.add(product.sku);
}

for (const item of products) {
  const product = await prisma.product.upsert({
    where: { slug: item.slug },
    update: {
      name: item.name,
      sku: item.sku,
      description: item.description,
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      stock: item.stock,
      status: ProductStatus.ACTIVE,
      storeId: store.id,
      categoryId: categoryId[item.category],
    },
    create: {
      name: item.name,
      slug: item.slug,
      sku: item.sku,
      description: item.description,
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      stock: item.stock,
      status: ProductStatus.ACTIVE,
      storeId: store.id,
      categoryId: categoryId[item.category],
    },
  });
  await prisma.productImage.deleteMany({ where: { productId: product.id } });
  await prisma.productImage.create({
    data: { productId: product.id, objectKey: item.image, altText: item.name, position: 0 },
  });
  const existing = await prisma.inventoryTransaction.findFirst({
    where: { productId: product.id, type: InventoryTransactionType.INITIAL },
  });
  if (!existing) {
    await prisma.inventoryTransaction.create({
      data: {
        productId: product.id,
        type: InventoryTransactionType.INITIAL,
        quantity: item.stock,
        before: 0,
        after: item.stock,
        reason: 'Seed stock',
      },
    });
  }
}

await prisma.coupon.upsert({
  where: { code: 'CHOVIET10' },
  update: { percentOff: 10, fixedAmountOff: null, minOrderAmount: 0, active: true, storeId: store.id },
  create: {
    code: 'CHOVIET10',
    storeId: store.id,
    percentOff: 10,
    minOrderAmount: 0,
    active: true,
  },
})

const address = await prisma.address.findFirst({
  where: { userId: buyer.id, line1: '12 Nguyễn Huệ' },
});
if (!address) {
  await prisma.address.create({
    data: {
      userId: buyer.id,
      recipientName: 'Nguyễn An',
      phone: '0912345678',
      line1: '12 Nguyễn Huệ',
      district: 'Quận 1',
      city: 'TP. Hồ Chí Minh',
      isDefault: true,
    },
  });
}

console.log(
  JSON.stringify({
    seller: seller.email,
    buyer: buyer.email,
    store: store.slug,
    categories: categories.length,
    products: products.length,
  }),
);
await prisma.$disconnect();
