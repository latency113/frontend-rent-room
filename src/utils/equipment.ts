export const STANDARD_EQUIPMENT = [
  'Projector',
  'Television',
  'Microphone',
  'Whiteboard',
  'Video Conference System',
  'Sound System',
  'Stage Light'
];

export const EQUIPMENT_THAI_MAP: Record<string, string> = {
  'Projector': 'เครื่องฉายโปรเจกเตอร์ (Projector)',
  'Television': 'สมาร์ททีวีจอใหญ่ (Television)',
  'Microphone': 'ไมโครโฟนไร้สาย (Microphone)',
  'Whiteboard': 'กระดานไวท์บอร์ด & ปากกา (Whiteboard)',
  'Video Conference System': 'ระบบประชุมทางไกล (Video Conference)',
  'Sound System': 'ระบบเครื่องเสียงรอบทิศทาง (Sound System)',
  'Stage Light': 'ระบบไฟเวที (Stage Light)'
};

export function getEquipmentUnit(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('microphone') || n.includes('ไมค์')) return 'ตัว';
  if (n.includes('projector') || n.includes('television') || n.includes('tv') || n.includes('ทีวี')) return 'เครื่อง';
  if (n.includes('whiteboard') || n.includes('ไวท์บอร์ด')) return 'บอร์ด';
  if (n.includes('system') || n.includes('conference') || n.includes('ระบบ') || n.includes('light')) return 'ชุด';
  return 'ชิ้น';
}

export function getEquipmentThaiName(name: string): string {
  return EQUIPMENT_THAI_MAP[name] || name;
}
