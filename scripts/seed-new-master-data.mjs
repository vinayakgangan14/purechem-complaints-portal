import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qgyjqwefauomhltbjtjy.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFneWpxd2VmYXVvbWhsdGJqdGp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQ2NzYxOSwiZXhwIjoyMTA3MDQzNjE5fQ.hh-QdJ7bPPZLnkv9roH8wXYh25bi6AyrycR7vzXXm-k";

const supabase = createClient(supabaseUrl, supabaseKey);

const rawProductList = `
BKT-PML-TAMSEAL\tBUCKET TAMPER SEAL
CCD-FGL-00FCT99L\tStyrofoam (240 cm x 120 cm x 50 m)
CCD-FGM-0000FC45\tTop Fix Super : Grey - 20 Kg
CCD-FGM-0000FCT3\tReebol - 210 Ltr
CCD-FGM-000FCT1B\tConbextra BB 80 - 20 Kg
CCD-FGM-000FCT3C\tReebol - 20 Ltr
CCD-FGM-000FCT68\tNitoflor Hardtop - 20 Kg
CCD-FGM-000FCT73\tBrushbond
CCD-FGM-000FCT77\tConplast WP 100 - 15 Kg
CCD-FGM-000FCT7E\tRenderoc FC
CCD-FGM-000FCT7F\tRenderoc HS  Extra - 20 Kg
CCD-FGM-000FCT83\tFosroc Solvent - 10 Ltr
CCD-FGM-000FCT97\tNitotile Grout : Grey - 5 Kg
CCD-FGM-00FCT10A\tConcure WB Clear - 200 Ltr
CCD-FGM-00FCT21D\tNitotile GP - 20 Kg
CCD-FGM-00FCT21F\tPure Poly Plaster - 20 Kg
CCD-FGM-00FCT21G\tPureplast Poly Screed 25 Kg Bucket
CCD-FGM-00FCT21N\tTop Fix Premium 20 Kgs
CCD-FGM-00FCT21W\tNitotile GP : White - 20 Kg
CCD-FGM-00FCT22F\tPureGyp Premium - 20 Kg
CCD-FGM-00FCT57B\tConbextra GP - 20 Kg
CCD-FGM-00FCT67B\tConplast SP 430 - 210 Ltr
CCD-FGM-00FCT67D\tConplast SP 430 - 20 Ltr
CCD-FGM-00FCT67E\tConplast SP 561 - 210 Ltr
CCD-FGM-00FCT69A\tConplast SP 432 MS - 210 Ltr
CCD-FGM-00FCT71B\tCebex 100 - 20 Kg
CCD-FGM-00FCT73A\tBrushbond FLX III
CCD-FGM-00FCT73C\tTop Shield:TS-501 Flexcote
CCD-FGM-00FCT77A\tTop Shield TS 101
CCD-FGM-00FCT85C\tFosroc Acid Etch - 20 Ltr
CCD-FGM-00FCT86C\tNew Conplast Blocksave - 20 Ltr
CCD-FGM-00FCT97A\tNitotile Grout : White - 5 Kg
CCD-FGM-00FCT97B\tTop Grout Tile-O : Black- (4x 5Kg)
CCD-FGM-00FCT97C\tNitotile Grout : Beige - 5 Kg
CCD-FGM-00KFCT80\tKonkreto RP 264 - 210 Ltr
CCD-FGM-0FCT10AS\tConcure WB Clear - 20 Lt
CCD-FGM-0FCT67BA\tConplast SP 430 - 1000 Ltr
CCD-FGM-0FCT97AB\tTop Grout Tile-O : Arena -(4 x 5Kg)
CCD-FGM-0FCT97AF\tTop Grout Tile-O : White - (4x 5Kg)
CCD-FGM-0FCT97AM\tTop Grout Tile-O : Dydima Beige - (4x 5Kg)
CCD-FGM-0FCT97B1\tTop Grout Tile-O : Black- (20 x 1Kg)
CCD-FGM-0FCT97CA\tTop Grout Tile-O : Uludag Grey - (4x 5Kg)
CCD-FGM-0FCT97GC\tTop Grout Tile-O : Beige - (4x 5Kg)
CCD-FGM-0FCT97TA\tNitotile Grout : Tortora 5 Kg
CCD-FGM-0KFCT67B\tKonkreto SP 430 - 210 Ltr
CCD-FGM-0KFCT67E\tKonkreto  SP 561 - 210 Ltr
CCD-FGM-0U999H1L\tUltracrete PC 999 H - 1000 Ltr
CCD-FGM-303200ML\tTop Shield TS 303 - 200 Ml x 30 Pcs
CCD-FGM-CA611000\tUltracrete CAST61   - 1000 Kgs
CCD-FGM-CAST6120\tUltracrete  CAST61   - 20Kgs
CCD-FGM-CGA1205L\tCemaide 1205- 1000 Ltr
CCD-FGM-CGA1299L\tCemaide 1299 - 1000 Ltr
CCD-FGM-CGA3065L\tCemaide 3065- 1000 Ltr
CCD-FGM-CGA986LT\tCemaide 986 - 1000 Ltr
CCD-FGM-FCT73ATS\tTop Shield TS 605 Flex coat 2k - 20 Kg
CCD-FGM-FCT73CTS\tTop Shield TS 615 Super Flex 2k - 12.5 Kg
CCD-FGM-FCT97AM1\tTop Grout Tile-O : Dydima Beige  - (20x 1Kg)
CCD-FGM-FCT97AQ1\tTop Grout Tile-O : Robins Egg - (20x 1Kg)
CCD-FGM-FCT97AR1\tTop Grout Tile-O : Cotto - (20x 1Kg)
CCD-FGM-FCT97CA1\tTop Grout Tile-O : Uludag Grey  - (20x 1Kg)
CCD-FGM-KFCT67BA\tKonkreto SP 430 - 1000 Ltr
CCD-FGM-KFCT80AB\tKonkreto RP 264 - 1000 Ltr
CCD-FGM-KKPC3501\tUltracrete PC 350- 1000 Kgs
CCD-FGM-KKPC3502\tUltracrete PC 350- 200 Kgs
CCD-FGM-KKPC7301\tUltracrete PC 730- 1000 Kgs
CCD-FGM-KKPC9991\tUltracrete PC 999 H - 1000 Kgs
CCD-FGM-KKPI5311\tUltracrete Viscora 5311 1000 Kgs
CCD-FGM-TS2021LT\tTop Shield TS 202 - 1 Ltr x 15 Pcs
CCD-FGM-TS20220L\tTop Shield TS 202 - 20 Ltr
CCD-FGM-TS2025LT\tTop Shield TS 202 - 5 Ltr x 4 Pcs
CCD-FGM-TS3031LT\tTop Shield TS 303 - 1 Ltr x 15 PCs
CCD-FGM-TS30320L\tTop Shield TS 303 - 20 Ltr
CCD-FGM-TS3035LT\tTop Shield TS 303 - 5 Ltr x 4 Pcs
CCD-FGT-0000FCT6\tS/C Hydrofoil - 250 mm
CCD-FGT-000FCT22\tNitofill EPLV
CCD-FGT-000FCT24\tNitofill UR 63
CCD-FGT-000FCT31\tPrimer No. 20 - 5 Ltr
CCD-FGT-000FCT34\tNitocote EP 405 : Blue - 4 Ltr
CCD-FGT-000FCT36\tNitocote EP 403
CCD-FGT-000FCT6M\tSupercast SW 20
CCD-FGT-000FCT74\tThioflex 600 - Gun Grade
CCD-FGT-000FCT7F\tRenderoc HS Xtra - 20 Kg
CCD-FGT-000FCT7G\tRenderoc Plug - 10 Kg
CCD-FGT-000FCT90\tFosroc G - Gun
CCD-FGT-00FCT24A\tNitofill WS 60
CCD-FGT-00FCT26A\tNitoprime Zincrich - 1.9 Ltr
CCD-FGT-00FCT28B\tTop Flor: Pureprime25
CCD-FGT-00FCT40N\tNitoflor SL 2000 Natural
CCD-FGT-00FCT54F\tLokfix E45T 300 mL
CCD-FGT-00FCT70D\tExpancell - 30 mm
CCD-FGT-00FCT72V\tFlooring C/Pack - Traffic Yellow
CCD-FGT-00FCT73J\tBrushbond TGP - 20 Kg
CCD-FGT-00FCT75A\tColpor 200
CCD-FGT-00FCT83A\tCemtop 400 SD
CCD-FGT-00FCT90C\tElectric Heater Blade
CCD-FGT-00FCT99B\tFibre Board - 25 mm
CCD-FGT-0FCT72GA\tFlooring C/Pack - Squirrel Grey
CCD-FGT-0FCT73JA\tTop Shield TS -515 TGP
CCD-IMT-000FCT78\tConplast RP 264 - Intermediate
CCD-IMT-00KFCT78\tAdmixture RP 264 Bulk Liquid
CCD-IMT-0FCTS202\tTop Shield TS 202 Bulk Liquid
CCD-IMT-0KKPC350\tUltracrete PC 350 Bulk Liquid
CCD-IMT-KFCT67BA\tAdmixture SNF Bulk Liquid SP 430
CCD-PML-00000PDS\tSteel Drums : Close - 200 Kg
CCD-PML-0000PPWS\tPP Woven Plain Sac - 20 Kg.
CCD-PML-0PP1000D\t1000 Ltr Ibc Tank
CCD-PML-0TS202L1\tTop Shield TS202 - 1 Ltr  Label
CCD-PML-0TS202L5\tTop Shield TS202 - 5 Ltr  Label
CCD-PML-0TS303L1\tTop Shield TS303 - 1 Ltr  Label
CCD-PML-0TS303L5\tTop Shield TS303 - 5 Ltr  Label
CCD-PML-20220LBL\tTop Shield TS202 - 20 Ltr  Back Label
CCD-PML-TS20220L\tTop Shield TS202 - 20 Ltr  Front Label
CCD-PML-TS3032LT\tCartons Top Shield TS-303- 2 Ltr - 3 Ply
CCD-RMI-0000RCF9\tCalcium Stearate
CCD-RMI-00RCF16A\tCulminal C 9115
CCD-RML-00000H20\tWater
CCD-RML-000RCF3D\tWhite Sand (Dry)
CCD-RML-000RCF3E\tWhite Sand (Wet) -  (Bulk)
CCD-RML-000RCF4A\tCement - White : 40 Kg
CCD-RML-000RCF4E\tPurechem Cement 32.5 Grade
CCD-RML-000RTM27\tSodium Gluconate
CCD-RML-00DLP212\tDLP 212
CCD-RML-0FCT78WN\tDefoamer PCE
CCD-RML-0RCA10AB\tSodium Chloride
CPD-FGM-00000FC9\tTop Bond - 1 Kg
CPD-FGM-0000FC10\tTop Bond - 500 Gm
CPD-FGM-0000FC11\tTop Bond - 250 Gm
CPD-FGM-0000FC13\tNew CC - 12 x 500 mL
CPD-FGM-0000FC23\tTop Bond - 2 Kg
CPD-FGM-0000FC29\tTop Bond - 100 Gm
CPD-FGM-0000FC36\tTopgit - 1 Kg
CPD-FGM-0000FC37\tTopgit - 250 Gms
CPD-FGM-0000FC42\tTop Gum - 150 mL
CPD-FGM-0000FC43\tTop Gum - 50 mL
CPD-FGM-0000FC44\tTop Gum - 100 mL
CPD-FGM-0000FC45\tTop Bond Craft Glue - 50 gm
CPD-FGM-0000FC46\tTop Bond Craft Glue - 100 gm
CPD-FGM-0000FC50\tCoated Wood Guard 5 Ltr
CPD-FGM-0000FC8N\tTop Bond - 5 Kg
CPD-FGM-000FC230\tFixol - 10 Kg
CPD-FGM-000FC24A\tTop Bond - 10 Kg Bucket
CPD-FGM-000FC24B\tTop Bond - 20 Kg Bucket
CPD-FGM-000FC250\tFixol - 3.5 Kg
CPD-FGM-000FC350\tFixol - 7.5 Kg
CPD-FGM-000FC37M\tTopgit - Medium Duty 250 Gms
CPD-FGM-000FC38M\tTopgit - Medium Duty 115 Gms
CPD-FGM-000FC38N\tTopgit - 115 Gms
CPD-FGM-000FC52S\tTop Bond : VTA Super - 4 Ltr
CPD-FGM-00FC24BE\tTop Bond - 20 Kg Bucket (E)
CPD-FGT-0000FC13\tNew CC - 500 mL
CPD-FGT-0000FC17\tNew CC - 1 Ltr
CPD-FGT-0000FC18\tNew CC - 250 mL
CPD-FGT-0000FC19\tNew CC - 15 Kg
CPD-FGT-000FC16D\tNew CC - 3 Kg
CPD-IMT-0000FC25\tTop Bond Adhesive - Bulk
CPD-IMT-0000FC35\tTopgit - Bulk Adhesive
CPD-IMT-0000FC40\tTop Gum - Bulk Adhesive
CPD-IMT-0000FKB3\tBottle Top Bond - 1 Kg
CPD-IMT-0000RK5R\tRegrind Mat L-Hdpe : Injection
CPD-IMT-000CTGI3P\tPlain Inner Top Gum
CPD-IMT-000CTGO4\tPlain Outer Top Bond Craft Glue
CPD-IMT-000PGUM3\tBottle Top Gum 50 mL
CPD-IMT-000PGUM4\tBottle Top Gum 100 mL
CPD-IMT-000PTOP1\tContainer Top Bond - 1 Kg
CPD-IMT-000RK3RF\tHDPE Blow Flash
CPD-IMT-00CTGI3B\tTop Bond Craft Glue Inner - Blue
CPD-IMT-00PTOP12\tContainer Fixol - 3.5 Kg
CPD-IMT-0PTOPVTA\tTop Bond  VTA - 5 Kg Bucket
CPD-PMI-00ITGB01\tTop Git - Screw Cap With Short Brush
CPD-PMI-00ITGB02\tTop Git - Screw Cap With Medium Brush
CPD-PMI-00ITGB03\tTop Git - Screw Cap With Long Brush
CPD-PML-0000FSI1\tFilm Seal Top Bond - 250 Gm
CPD-PML-0000FSI2\tFilm Seal Top Bond - 500 Gm
CPD-PML-0000FSI3\tFilm Seal Top Bond - 1 Kg
CPD-PML-0000FSI6\tFilm Seal Top Bond - 100 gms
CPD-PML-000PTGC2\tCartons Top Git 250 Gm
CPD-PML-000PTGC3\tCartons Top Git 115 Gm
CPD-PML-00MDPTG2\tContainer Top Git - 250 Gm Medium Duty
CPD-PML-00PTGC3A\tCartons Top Git 115 Gm - Medium Duty
CPD-PML-00PTOP8S\tTop Bond - 10 Kg Empty Bucket
CPD-PML-00PTOPS3\tBucket Top Bond - 20 Kg New
CPD-RMI-000RTS6Y\tPolyvinyl Alcohol : PVA - BP-26
CPD-RML-00000RK7\tPrinting Ink - Blue
CPD-RML-0000RK13\tPP Co-Polymer Injection
ENG-FA-CN-AG-001\tDiesel
IAD-FGM-0000792B\tPC 792B
IAD-FGM-0000793B\tPC 793 B
IAD-FGM-0000FA4A\tPC 1000/81 - 200 Kg
IAD-FGM-0000FA4B\tPC 1000 M - 200 Kg
IAD-FGM-0000FA4D\tPC 1000 E - 200 Kg
IAD-FGM-0000FA5A\tPC 2000 M - 200 Kg
IAD-FGM-0000FA8A\tPC 812 M - 30 Kg
IAD-FGM-0000FC7C\tPC 7000 - 20 Kg
IAD-FGM-0000FC9D\tPC 1025 - 200 Kg
IAD-FGM-0000FPU3\tPC 2511 - 200 Kg
IAD-FGM-0000FPU4\tPC 1511A - 5Kg
IAD-FGM-0000PC45\tPC 45
IAD-FGM-0006092A\tPC 6092 A
IAD-FGM-0006093A\tPC 6093 A
IAD-FGM-000B1001\tPC LAMI B 1001: 200 Kgs
IAD-FGM-000FC16F\tNew CC Spray Adhesive 230 Kgs NF
IAD-FGM-000FPU54\tPC -2754 200 Kg
IAD-FGM-000FTF20\tPurestiff Sun - 200 Kg
IAD-FGM-00FA8AGS\tPC-GS1100 - 30 KG
IAD-FGM-8012FPU3\tPC 8012 - 200 Kg
IAD-FGT-000FC16E\tNew CC Spray Adhesive - 16.5 L
IAD-FGT-000FHT39\tHotmelt Granule 733 PC - 20 Kg
IAD-FGT-000FHT52\tHotmelt Adhesive 759 MI
IAD-IMT-000FA8AB\tPC 812 M - Bulk Adhesive
IAD-PMI-00FA8AGS\tPC GS 1100 Adhesive - 30 Kg Bucket
IAD-PML-0000PDON\tOpen Metal Drum - New ( 200 Kg)
IAD-PML-000BP20L\tBucket - Plain : 20 Ltr
IAD-PML-000PWTSL\tPlain White Tab Seal : Small
IAD-PML-00PWTSL1\tPlain White Tab Seal : Big
IAD-PML-LBPC812M\tPC 812 M - 30 KG (200 x 482) Labels
IAD-RMI-0000AK75\tAknate AK-75
IAD-RMI-0000PU23\tMethylenediphenyl Diisocyanate (MDI)
IAD-RMI-0000PU30\tPolypropylene Glycol PPG-1000
IAD-RML-00000PU2\tDi Ethylene Glycol
`;

// Helper: determine Category (IAD, CPD, CCD, DCP)
function categorize(code, desc) {
  const c = code.toUpperCase();
  const d = desc.toLowerCase();

  // Dry Powder Chemical (DCP) check: cement, plaster, screed, powder grouts, gyp
  if (
    c.startsWith("DCP-") ||
    d.includes("cement") ||
    d.includes("pure poly plaster") ||
    d.includes("pureplast poly screed") ||
    d.includes("puregyp") ||
    d.includes("nitoflor hardtop") ||
    d.includes("renderoc") ||
    d.includes("conbextra") ||
    d.includes("white sand") ||
    d.includes("cemtop")
  ) {
    return "DCP-Dry Powder Chemical";
  }

  if (c.startsWith("IAD-")) {
    return "IAD-Industrial Adhesive";
  }
  if (c.startsWith("CPD-")) {
    return "CPD-Consumer Product Division";
  }
  if (c.startsWith("CCD-")) {
    return "CCD-Construction Chemical Division";
  }

  // Fallbacks
  if (d.includes("adhesive") || d.includes("glue") || d.includes("top bond") || d.includes("topgit")) {
    return "CPD-Consumer Product Division";
  }
  return "CCD-Construction Chemical Division";
}

function extractPackSize(desc) {
  // Try matching e.g. "20 Kg", "210 Ltr", "1000 Ltr", "500 Gm", "1 Kg", "15 PCs", etc.
  const match = desc.match(/[-:]\s*([0-9xX.,\s]+(?:Kg|Kgs|Ltr|Lt|mL|Gm|Gms|Pcs|PCs|m|Bucket|Bag|Can|Drum).*)$/i);
  if (match) return match[1].trim();
  const simpleMatch = desc.match(/([0-9.]+\s*(?:Kg|Kgs|Ltr|Lt|mL|Gm|Gms|mm))/i);
  return simpleMatch ? simpleMatch[1].trim() : "";
}

async function main() {
  console.log("=== 1. SEEDING CATEGORIES ===");
  const categories = [
    { name: "IAD-Industrial Adhesive", code: "IAD", description: "Industrial Adhesives & Solvents", active: true },
    { name: "CPD-Consumer Product Division", code: "CPD", description: "Consumer Products, Top Bond, Topgit, Craft Glue", active: true },
    { name: "CCD-Construction Chemical Division", code: "CCD", description: "Construction Chemicals, Admixtures, Waterproofing", active: true },
    { name: "DCP-Dry Powder Chemical", code: "DCP", description: "Dry Powder Chemicals, Mortars, Grouts, Cements, Plasters", active: true },
  ];

  for (const cat of categories) {
    await supabase.from("product_categories").upsert(cat, { onConflict: "name" });
  }
  console.log("Categories seeded successfully!");

  console.log("=== 2. PARSING & DEDUPLICATING PRODUCTS ===");
  const lines = rawProductList.trim().split("\n");
  const productMap = new Map();

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    const itemCode = parts[0].trim();
    const itemDesc = parts[1].trim();
    if (!itemCode || !itemDesc) continue;

    if (!productMap.has(itemCode)) {
      const cat = categorize(itemCode, itemDesc);
      const pack = extractPackSize(itemDesc);
      productMap.set(itemCode, {
        product_code: itemCode,
        product_name: `${itemCode} - ${itemDesc}`,
        category_name: cat,
        pack_size: pack,
        description: itemDesc,
        active: true,
      });
    }
  }

  const productsToInsert = Array.from(productMap.values());
  console.log(`Found ${productsToInsert.length} unique products to seed into Supabase.`);

  // Batch insert in chunks of 50
  for (let i = 0; i < productsToInsert.length; i += 50) {
    const chunk = productsToInsert.slice(i, i + 50);
    const { error } = await supabase.from("products").upsert(chunk, { onConflict: "product_code" });
    if (error) {
      console.error(`Chunk error at ${i}:`, error.message);
    }
  }
  console.log("Products seeded into Supabase!");

  console.log("=== 3. SEEDING USERS / STAFF ===");
  const staffList = [
    {
      name: "Rajesh Poojari",
      email: "rajesh.poojari@purechemmanufacturing.com",
      phone: "+2348000000001",
      company: "Purechem Manufacturing Ltd",
      role: "quality_manager",
      customer_type: "Quality",
      is_active: true,
    },
    {
      name: "Vinayak Gangan",
      email: "vinayak.gangan@purechemmanufacturing.com",
      phone: "+2348000000002",
      company: "Purechem Manufacturing Ltd",
      role: "production",
      customer_type: "Production",
      is_active: true,
    },
    {
      name: "Sunil Patro",
      email: "sunil.patro@purechemmanufacturing.com",
      phone: "+2348000000003",
      company: "Purechem Manufacturing Ltd",
      role: "production",
      customer_type: "Production",
      is_active: true,
    },
    {
      name: "Ishan Phadke",
      email: "ishan.phadke@purechemmanufacturing.com",
      phone: "+2348000000004",
      company: "Purechem Manufacturing Ltd",
      role: "sales",
      customer_type: "Sales",
      is_active: true,
    },
    {
      name: "Indra",
      email: "indra@purechemmanufacturing.com",
      phone: "+2348000000005",
      company: "Purechem Manufacturing Ltd",
      role: "sales",
      customer_type: "Sales",
      is_active: true,
    },
    {
      name: "Lognath",
      email: "lognath@purechemmanufacturing.com",
      phone: "+2348000000006",
      company: "Purechem Manufacturing Ltd",
      role: "sales",
      customer_type: "Sales",
      is_active: true,
    },
    {
      name: "Aravind Nagraj",
      email: "aravind.nagraj@purechemmanufacturing.com",
      phone: "+2348000000007",
      company: "Purechem Manufacturing Ltd",
      role: "sales",
      customer_type: "Sales",
      is_active: true,
    },
  ];

  for (const staff of staffList) {
    const { error } = await supabase.from("users").upsert(staff, { onConflict: "email" });
    if (error) console.error("Error inserting staff", staff.name, error.message);
  }
  console.log("Staff users seeded successfully!");

  console.log("=== COMPLETED MASTER SEED ===");
}

main().catch(console.error);
