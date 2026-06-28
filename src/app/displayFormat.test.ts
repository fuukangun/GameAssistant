import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatConfidence,
  formatEquipmentList,
  formatEquipmentName,
  formatEquipmentValue,
  formatFarmType,
  formatFriendshipPoints,
  formatLuck,
  formatNpcName,
  formatPriority,
  formatRoute,
  formatSeason,
  sortRelationshipsByFriendship,
} from './displayFormat.ts';

test('formats common game labels in Chinese', () => {
  assert.equal(formatSeason('spring'), '春季');
  assert.equal(formatFarmType('standard'), '标准农场');
  assert.equal(formatRoute('community_center'), '社区中心路线');
  assert.equal(formatNpcName('Sebastian'), '塞巴斯蒂安');
  assert.equal(formatNpcName('Dwarf'), '矮人');
  assert.equal(formatNpcName('Dwarf', 'en-US'), 'Dwarf');
  assert.equal(formatNpcName('Henchman'), '仆从');
  assert.equal(formatNpcName('Henchman', 'en-US'), 'Henchman');
  assert.equal(formatPriority('optional'), '可选');
  assert.equal(formatConfidence('medium'), '中');
  assert.equal(formatLuck(0.08), '精灵非常开心');
  assert.equal(formatLuck(0.03), '精灵心情不错');
  assert.equal(formatLuck(0), '精灵保持中立');
  assert.equal(formatLuck(-0.03), '精灵有点烦躁');
  assert.equal(formatLuck(-0.08), '精灵非常不悦');
  assert.equal(formatLuck(undefined), '运势未解析');
});

test('sorts relationships by friendship points descending', () => {
  const sorted = sortRelationshipsByFriendship([
    { npc: 'Abigail', points: 250, hearts: 1 },
    { npc: 'Sebastian', points: 1000, hearts: 4 },
  ]);

  assert.deepEqual(sorted.map((item) => item.npc), ['Sebastian', 'Abigail']);
});

test('formats friendship points with an explicit heart unit', () => {
  assert.equal(formatFriendshipPoints({ points: 1889, hearts: 7 }), '1889 / 7❤️');
});

test('formats missing equipment with specific status text', () => {
  assert.equal(formatEquipmentValue(undefined, '未拥有'), '未拥有');
  assert.equal(formatEquipmentValue('Copper Hoe', '未携带'), '铜锄头');
  assert.equal(formatEquipmentList([], '未装备'), '未装备');
  assert.equal(formatEquipmentList(['Glow Ring', 'Magnet Ring'], '未装备'), '光辉戒指、磁铁戒指');
});

test('formats equipment names by language and carried state', () => {
  assert.equal(formatEquipmentName('Iridium Pickaxe', 'zh-CN'), '铱十字镐');
  assert.equal(formatEquipmentName('Galaxy Sword', 'zh-CN'), '银河剑');
  assert.equal(formatEquipmentList(['Iridium Band', "Burglar's Ring"], '未装备', 'zh-CN'), '铱环、窃贼戒指');
  assert.equal(formatEquipmentName('Iridium Pickaxe', 'en-US'), 'Iridium Pickaxe');
  assert.equal(formatEquipmentValue('Steel Axe', '未携带', 'zh-CN', false), '钢斧（未携带）');
  assert.equal(formatEquipmentValue('Steel Axe', 'Not carried', 'en-US', false), 'Steel Axe (not carried)');
});
