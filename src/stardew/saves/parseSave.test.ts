import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { formatEquipmentList, formatEquipmentName } from '../../app/displayFormat.ts';
import { parseStardewSaveXml } from './parseSave.ts';

const fixture = `<?xml version="1.0" encoding="utf-8"?>
<SaveGame>
  <uniqueIDForThisGame>123456</uniqueIDForThisGame>
  <gameVersion>1.6.15</gameVersion>
  <year>1</year>
  <currentSeason>summer</currentSeason>
  <dayOfMonth>14</dayOfMonth>
  <weatherForTomorrow>sunny</weatherForTomorrow>
  <whichFarm>0</whichFarm>
  <player>
    <name>Farmer</name>
    <farmName>Sunrise Farm</farmName>
    <money>23500</money>
    <totalMoneyEarned>50000</totalMoneyEarned>
    <maxStamina>270</maxStamina>
    <maxItems>36</maxItems>
    <farmingLevel>6</farmingLevel>
    <miningLevel>4</miningLevel>
    <foragingLevel>5</foragingLevel>
    <fishingLevel>3</fishingLevel>
    <combatLevel>2</combatLevel>
    <items>
      <Item>
        <Name>紫水晶</Name>
        <Stack>1</Stack>
        <Quality>0</Quality>
        <ItemId>66</ItemId>
      </Item>
    </items>
  </player>
  <locations>
    <GameLocation>
      <name>Farm</name>
      <terrainFeatures>
        <item>
          <value>
            <TerrainFeature>
              <crop>
                <indexOfHarvest>258</indexOfHarvest>
                <Name>蓝莓</Name>
                <isReadyForHarvest>true</isReadyForHarvest>
                <quantity>12</quantity>
                <sellPrice>50</sellPrice>
              </crop>
            </TerrainFeature>
          </value>
        </item>
      </terrainFeatures>
    </GameLocation>
  </locations>
</SaveGame>`;

test('parses core Stardew save fields from XML', () => {
  const snapshot = parseStardewSaveXml(fixture, '/tmp/Farmer_123456', '2026-06-18T00:00:00.000Z');

  assert.equal(snapshot.saveIdentity.uniqueId, '123456');
  assert.equal(snapshot.farm.playerName, 'Farmer');
  assert.equal(snapshot.farm.farmName, 'Sunrise Farm');
  assert.equal(snapshot.time.season, 'summer');
  assert.equal(snapshot.time.day, 14);
  assert.equal(snapshot.weatherForTomorrow, 'sunny');
  assert.equal(snapshot.wallet.money, 23500);
  assert.equal(snapshot.skills.farming, 6);
  assert.equal(snapshot.inventory[0].name, '紫水晶');
  assert.equal(snapshot.crops[0].name, '蓝莓');
  assert.equal(snapshot.crops[0].isReady, true);
  assert.deepEqual(snapshot.readyMachineOutputs, []);
  assert.deepEqual(snapshot.animalProducts, []);
  assert.equal(snapshot.animalFeed.animalCount, 0);
  assert.equal(snapshot.animalFeed.hayCount, undefined);
  assert.equal(snapshot.animalFeed.daysRemaining, undefined);
});

test('parses ready machine outputs from held objects', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>2</year>
      <currentSeason>summer</currentSeason>
      <dayOfMonth>8</dayOfMonth>
      <player><name>Farmer</name><farmName>Sunrise Farm</farmName></player>
      <locations>
        <GameLocation>
          <name>Farm</name>
          <objects>
            <item>
              <value>
                <Object>
                  <Name>Keg</Name>
                  <heldObject>
                    <Object>
                      <Name>Wine</Name>
                      <ItemId>348</ItemId>
                      <Stack>1</Stack>
                    </Object>
                  </heldObject>
                  <readyForHarvest>true</readyForHarvest>
                </Object>
              </value>
            </item>
          </objects>
        </GameLocation>
      </locations>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.deepEqual(snapshot.readyMachineOutputs, [{
    id: '348',
    name: 'Wine',
    quantity: 1,
    source: 'machine',
    sourceName: 'Keg',
  }]);
});

test('parses ready machine outputs from held chest containers', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <year>6</year>
      <currentSeason>winter</currentSeason>
      <dayOfMonth>14</dayOfMonth>
      <player><name>Farmer</name><farmName>Vanilla</farmName></player>
      <locations>
        <GameLocation>
          <name>Farm</name>
          <objects>
            <item>
              <value>
                <Object>
                  <Name>Auto-Grabber</Name>
                  <heldObject>
                    <Object xsi:type="Chest">
                      <name>Chest</name>
                      <items>
                        <Item xsi:type="Object">
                          <Name>Large Milk</Name>
                          <ItemId>186</ItemId>
                          <Stack>6</Stack>
                        </Item>
                      </items>
                    </Object>
                  </heldObject>
                </Object>
              </value>
            </item>
          </objects>
        </GameLocation>
      </locations>
    </SaveGame>`,
    '/tmp/Vanilla_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.deepEqual(snapshot.readyMachineOutputs, [{
    id: '186',
    name: 'Large Milk',
    quantity: 6,
    source: 'machine',
    sourceName: 'Auto-Grabber',
  }]);
});

test('parses animal products and hay days remaining', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>2</year>
      <currentSeason>fall</currentSeason>
      <dayOfMonth>26</dayOfMonth>
      <player><name>Farmer</name><farmName>Sunrise Farm</farmName></player>
      <locations>
        <GameLocation>
          <name>Farm</name>
          <animals>
            <item>
              <value>
                <FarmAnimal>
                  <type>Cow</type>
                  <currentProduce>184</currentProduce>
                </FarmAnimal>
              </value>
            </item>
            <item>
              <value>
                <FarmAnimal>
                  <type>Chicken</type>
                  <currentProduce>176</currentProduce>
                </FarmAnimal>
              </value>
            </item>
          </animals>
          <piecesOfHay>3</piecesOfHay>
        </GameLocation>
      </locations>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.deepEqual(snapshot.animalProducts, [
    { id: '184', name: '牛奶', quantity: 1, source: 'animal', sourceName: 'Cow' },
    { id: '176', name: '鸡蛋', quantity: 1, source: 'animal', sourceName: 'Chicken' },
  ]);
  assert.deepEqual(snapshot.animalFeed, {
    animalCount: 2,
    hayCount: 3,
    daysRemaining: 1,
  });
});

test('decodes XML entities in player and farm names', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>2</dayOfMonth>
      <player>
        <name>Alice &amp; Bob</name>
        <farmName>Morning &amp; Night Farm</farmName>
      </player>
    </SaveGame>`,
    '/tmp/Alice_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.farm.playerName, 'Alice & Bob');
  assert.equal(snapshot.farm.farmName, 'Morning & Night Farm');
});

test('parses deepest mine level from player fields', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>2</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <deepestMineLevel>85</deepestMineLevel>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.farm.mineLevel, 85);
});

test('splits internal mine depth into regular mine and skull cavern depth', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>2</year>
      <currentSeason>summer</currentSeason>
      <dayOfMonth>8</dayOfMonth>
      <busFixed>true</busFixed>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <deepestMineLevel>156</deepestMineLevel>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.farm.mineLevel, 120);
  assert.equal(snapshot.farm.skullCavernLevel, 36);
  assert.equal(snapshot.farm.hasSkullCavernAccess, true);
});

test('parses carried tools and fishing bait from player items', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>2</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <items>
          <Item><Name>Copper Hoe</Name><Stack>1</Stack></Item>
          <Item><Name>Steel Pickaxe</Name><Stack>1</Stack></Item>
          <Item><Name>Iron Axe</Name><Stack>1</Stack></Item>
          <Item><Name>Gold Watering Can</Name><Stack>1</Stack></Item>
          <Item><Name>Scythe</Name><Stack>1</Stack></Item>
          <Item><Name>Copper Trash Can</Name><Stack>1</Stack></Item>
          <Item><Name>Copper Pan</Name><Stack>1</Stack></Item>
          <Item>
            <Name>Fiberglass Rod</Name>
            <Stack>1</Stack>
            <attachments>
              <Object><Name>Bait</Name><Stack>24</Stack></Object>
            </attachments>
          </Item>
        </items>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.player.equipment.hoeName, 'Copper Hoe');
  assert.equal(snapshot.player.equipment.pickaxeName, 'Steel Pickaxe');
  assert.equal(snapshot.player.equipment.axeName, 'Iron Axe');
  assert.equal(snapshot.player.equipment.wateringCanName, 'Gold Watering Can');
  assert.equal(snapshot.player.equipment.scytheName, 'Scythe');
  assert.equal(snapshot.player.equipment.trashCanName, 'Copper Trash Can');
  assert.equal(snapshot.player.equipment.panName, 'Copper Pan');
  assert.equal(snapshot.player.equipment.fishingRodName, 'Fiberglass Rod');
  assert.equal(snapshot.player.equipment.baitName, 'Bait x24');
});

test('parses Stardew 1.6 lowercase equipment fields and item ids', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>2</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <items>
          <Item xsi:type="Pickaxe"><name>Pickaxe</name><itemId>IridiumPickaxe</itemId><stack>1</stack><upgradeLevel>4</upgradeLevel></Item>
          <Item xsi:type="Axe"><name>Axe</name><itemId>Axe</itemId><stack>1</stack><upgradeLevel>0</upgradeLevel></Item>
          <Item xsi:type="Hoe"><name>Hoe</name><itemId>SteelHoe</itemId><stack>1</stack><upgradeLevel>2</upgradeLevel></Item>
          <Item xsi:type="WateringCan"><name>Watering Can</name><itemId>WateringCan</itemId><stack>1</stack><upgradeLevel>0</upgradeLevel></Item>
          <Item xsi:type="FishingRod">
            <name>Fishing Rod</name>
            <itemId>IridiumRod</itemId>
            <stack>1</stack>
            <attachments>
              <Object><name>Bait</name><itemId>685</itemId><stack>39</stack></Object>
            </attachments>
          </Item>
          <Item xsi:type="MeleeWeapon"><name>Crystal Dagger</name><itemId>21</itemId><stack>1</stack></Item>
          <Item xsi:type="MeleeWeapon"><name>Scythe</name><itemId>47</itemId><stack>1</stack></Item>
        </items>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.player.equipment.pickaxeName, 'Iridium Pickaxe');
  assert.equal(snapshot.player.equipment.axeName, 'Axe');
  assert.equal(snapshot.player.equipment.hoeName, 'Steel Hoe');
  assert.equal(snapshot.player.equipment.wateringCanName, 'Watering Can');
  assert.equal(snapshot.player.equipment.fishingRodName, 'Iridium Rod');
  assert.equal(snapshot.player.equipment.baitName, 'Bait x39');
  assert.equal(snapshot.player.equipment.weaponName, 'Crystal Dagger');
  assert.equal(snapshot.player.equipment.scytheName, 'Scythe');
});

test('parses owned equipment from storage as not carried', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>2</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <items>
          <Item xsi:type="Hoe"><name>Hoe</name><itemId>Hoe</itemId><stack>1</stack></Item>
        </items>
      </player>
      <locations>
        <GameLocation>
          <objects>
            <item>
              <value>
                <Object xsi:type="Chest">
                  <name>Chest</name>
                  <items>
                    <Item xsi:type="Axe"><name>Axe</name><itemId>SteelAxe</itemId><stack>1</stack></Item>
                  </items>
                </Object>
              </value>
            </item>
          </objects>
        </GameLocation>
      </locations>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.player.equipment.hoeName, 'Hoe');
  assert.equal(snapshot.player.equipment.axeName, 'Steel Axe');
  assert.equal(snapshot.player.equipment.carried?.axe, false);
  assert.equal(snapshot.player.equipment.carried?.hoe, true);
});

test('does not treat regular items containing pan as the panning tool', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>2</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <items />
      </player>
      <locations>
        <GameLocation>
          <objects>
            <item>
              <value>
                <Object xsi:type="Chest">
                  <name>Chest</name>
                  <items>
                    <Item xsi:type="Object"><name>Summer Spangle</name><itemId>593</itemId><stack>1</stack></Item>
                  </items>
                </Object>
              </value>
            </item>
          </objects>
        </GameLocation>
      </locations>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.player.equipment.panName, undefined);
});

test('parses exploration readiness fields from save data', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>2</year>
      <currentSeason>fall</currentSeason>
      <dayOfMonth>9</dayOfMonth>
      <dailyLuck>0.08</dailyLuck>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <health>84</health>
        <maxHealth>115</maxHealth>
        <mailReceived>
          <string>willyBoatFixed</string>
        </mailReceived>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.player.health, 84);
  assert.equal(snapshot.player.maxHealth, 115);
  assert.equal(snapshot.player.dailyLuck, 0.08);
  assert.equal(snapshot.farm.hasIslandAccess, true);
});

test('keeps route unknown before player commits to community center or Joja', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>1</dayOfMonth>
      <hasRestoredCommunityCenter>false</hasRestoredCommunityCenter>
      <locations>
        <GameLocation>
          <name>CommunityCenter</name>
          <bundles>
            <item>
              <key><int>0</int></key>
              <value>
                <ArrayOfBoolean>
                  <boolean>false</boolean>
                  <boolean>false</boolean>
                  <boolean>false</boolean>
                </ArrayOfBoolean>
              </value>
            </item>
          </bundles>
        </GameLocation>
        <GameLocation>
          <name>SkullCave</name>
        </GameLocation>
      </locations>
      <player>
        <name>Fun</name>
        <farmName>fun</farmName>
        <hasSkullKey xsi:nil="true" />
        <hasUnlockedSkullDoor xsi:nil="true" />
        <mailReceived><string>button_tut_1</string></mailReceived>
      </player>
    </SaveGame>`,
    '/tmp/Fun_123456',
    '2026-06-20T00:00:00.000Z',
  );

  assert.equal(snapshot.farm.communityCenterRoute, 'unknown');
  assert.equal(snapshot.farm.hasDesertAccess, false);
  assert.equal(snapshot.farm.hasSkullCavernAccess, false);
  assert.equal(snapshot.progression.communityCenter?.percentage, 0);
});

test('parses desert, ginger island, skull cavern, and volcano unlocks independently', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>3</year>
      <currentSeason>fall</currentSeason>
      <dayOfMonth>11</dayOfMonth>
      <busFixed>false</busFixed>
      <player>
        <name>Moja</name>
        <farmName>Moja Joja</farmName>
        <mailReceived>
          <string>JojaMember</string>
          <string>Island_Turtle</string>
        </mailReceived>
        <hasSkullKey>true</hasSkullKey>
        <hasUnlockedSkullDoor>true</hasUnlockedSkullDoor>
        <eventsSeen>
          <int>Visited_Island</int>
        </eventsSeen>
      </player>
      <locations>
        <GameLocation>
          <name>VolcanoDungeon</name>
        </GameLocation>
      </locations>
    </SaveGame>`,
    '/tmp/Moja_123456',
    '2026-06-20T00:00:00.000Z',
  );

  assert.equal(snapshot.farm.hasDesertAccess, false);
  assert.equal(snapshot.farm.hasIslandAccess, true);
  assert.equal(snapshot.farm.hasSkullCavernAccess, true);
  assert.equal(snapshot.farm.hasVolcanoDungeonAccess, true);
});

test('parses basic joja project progress from save markers', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>2</year>
      <currentSeason>fall</currentSeason>
      <dayOfMonth>9</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <mailReceived>
          <string>JojaMember</string>
          <string>jojaBoilerRoom</string>
          <string>jojaVault</string>
        </mailReceived>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.farm.communityCenterRoute, 'joja');
  assert.deepEqual(snapshot.progression.joja, {
    completedProjects: 2,
    totalProjects: 5,
    completedMarkers: ['jojaBoilerRoom', 'jojaVault'],
  });
});

test('parses community center progress from community center location bundles', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>1</year>
      <currentSeason>summer</currentSeason>
      <dayOfMonth>12</dayOfMonth>
      <hasRestoredCommunityCenter>false</hasRestoredCommunityCenter>
      <locations>
        <GameLocation>
          <name>CommunityCenter</name>
          <areasComplete>
            <boolean>true</boolean>
            <boolean>false</boolean>
            <boolean>true</boolean>
            <boolean>false</boolean>
            <boolean>false</boolean>
            <boolean>false</boolean>
          </areasComplete>
          <bundles>
            <item>
              <key><int>0</int></key>
              <value>
                <ArrayOfBoolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                </ArrayOfBoolean>
              </value>
            </item>
            <item>
              <key><int>1</int></key>
              <value>
                <ArrayOfBoolean>
                  <boolean>true</boolean>
                  <boolean>false</boolean>
                </ArrayOfBoolean>
              </value>
            </item>
          </bundles>
        </GameLocation>
      </locations>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.farm.communityCenterRoute, 'community_center');
  assert.equal(snapshot.progression.communityCenter?.completed, false);
  assert.equal(snapshot.progression.communityCenter?.percentage, 50);
  assert.deepEqual(snapshot.progression.communityCenter?.bundleStates, [
    { key: 0, completed: true, donatedSlots: [true, true] },
    { key: 1, completed: true, donatedSlots: [true, false] },
  ]);
});

test('counts community center bundle progress by completed bundles instead of bundle slots', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>6</year>
      <currentSeason>winter</currentSeason>
      <dayOfMonth>14</dayOfMonth>
      <hasRestoredCommunityCenter>false</hasRestoredCommunityCenter>
      <locations>
        <GameLocation>
          <name>CommunityCenter</name>
          <areasComplete>
            <boolean>true</boolean>
            <boolean>true</boolean>
            <boolean>true</boolean>
            <boolean>true</boolean>
            <boolean>true</boolean>
            <boolean>true</boolean>
          </areasComplete>
          <bundles>
            <item>
              <key><int>22</int></key>
              <value>
                <ArrayOfBoolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                </ArrayOfBoolean>
              </value>
            </item>
            <item>
              <key><int>23</int></key>
              <value>
                <ArrayOfBoolean>
                  <boolean>true</boolean>
                  <boolean>false</boolean>
                  <boolean>false</boolean>
                </ArrayOfBoolean>
              </value>
            </item>
            <item>
              <key><int>24</int></key>
              <value>
                <ArrayOfBoolean>
                  <boolean>true</boolean>
                  <boolean>false</boolean>
                  <boolean>false</boolean>
                </ArrayOfBoolean>
              </value>
            </item>
            <item>
              <key><int>25</int></key>
              <value>
                <ArrayOfBoolean>
                  <boolean>true</boolean>
                  <boolean>false</boolean>
                  <boolean>false</boolean>
                </ArrayOfBoolean>
              </value>
            </item>
            <item>
              <key><int>26</int></key>
              <value>
                <ArrayOfBoolean>
                  <boolean>true</boolean>
                  <boolean>false</boolean>
                  <boolean>false</boolean>
                </ArrayOfBoolean>
              </value>
            </item>
          </bundles>
        </GameLocation>
      </locations>
      <player>
        <name>Arkon</name>
        <farmName>Vanilla</farmName>
      </player>
    </SaveGame>`,
    '/tmp/Arkon_255003282',
    '2026-06-20T00:00:00.000Z',
  );

  assert.equal(snapshot.farm.communityCenterRoute, 'community_center');
  assert.equal(snapshot.progression.communityCenter?.completed, false);
  assert.equal(snapshot.progression.communityCenter?.percentage, 100);
});

test('parses completed community center location bundle entries from a small save fragment', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>3</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>7</dayOfMonth>
      <locations>
        <GameLocation>
          <name>CommunityCenter</name>
          <bundles>
            <item>
              <key><int>0</int></key>
              <value>
                <ArrayOfBoolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                  <boolean>true</boolean>
                </ArrayOfBoolean>
              </value>
            </item>
            <item>
              <key><int>1</int></key>
              <value>
                <ArrayOfBoolean>
                  <boolean>true</boolean>
                  <boolean>false</boolean>
                  <boolean>false</boolean>
                </ArrayOfBoolean>
              </value>
            </item>
          </bundles>
        </GameLocation>
      </locations>
      <player>
        <name>Redacted</name>
        <farmName>Redacted Farm</farmName>
      </player>
    </SaveGame>`,
    '/tmp/Redacted_123456',
    '2026-06-20T00:00:00.000Z',
  );

  assert.equal(snapshot.farm.communityCenterRoute, 'community_center');
  assert.equal(snapshot.progression.communityCenter?.completed, false);
  assert.equal(snapshot.progression.communityCenter?.percentage, 100);
  assert.deepEqual(snapshot.progression.communityCenter?.bundleStates, [
    { key: 0, completed: true, donatedSlots: [true, true, true, true] },
    { key: 1, completed: true, donatedSlots: [true, false, false] },
  ]);
});

test('warns on multiplayer farmhand fragments while keeping host fields', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>2</year>
      <currentSeason>fall</currentSeason>
      <dayOfMonth>18</dayOfMonth>
      <player>
        <name>Host</name>
        <farmName>Shared Farm</farmName>
        <money>9001</money>
      </player>
      <farmhands>
        <item>
          <Farmer>
            <name>Farmhand</name>
            <money>1</money>
          </Farmer>
        </item>
      </farmhands>
    </SaveGame>`,
    '/tmp/Host_123456',
    '2026-06-20T00:00:00.000Z',
  );

  assert.equal(snapshot.parseMeta.status, 'ok');
  assert.deepEqual(snapshot.parseMeta.warnings.map((warning) => warning.code), ['unsupported_multiplayer']);
  assert.equal(snapshot.farm.playerName, 'Host');
  assert.equal(snapshot.wallet.money, 9001);
});

test('parses anonymized storage chest object items from save fragments', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <year>1</year>
      <currentSeason>winter</currentSeason>
      <dayOfMonth>22</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Quiet Farm</farmName>
        <items />
      </player>
      <locations>
        <GameLocation>
          <name>Farm</name>
          <objects>
            <item>
              <value>
                <Object xsi:type="Chest">
                  <name>Chest</name>
                  <items>
                    <Item xsi:type="Object">
                      <itemId>388</itemId>
                      <stack>99</stack>
                    </Item>
                    <Item xsi:type="Object">
                      <name>Amethyst</name>
                      <itemId>(O)66</itemId>
                      <stack>2</stack>
                    </Item>
                  </items>
                </Object>
              </value>
            </item>
          </objects>
        </GameLocation>
      </locations>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-20T00:00:00.000Z',
  );

  assert.deepEqual(snapshot.inventory.map((item) => ({
    id: item.id,
    name: item.name,
    stack: item.stack,
    source: item.source,
    sourceLabel: item.sourceLabel,
  })), [
    { id: '388', name: '木材', stack: 99, source: 'chest', sourceLabel: '储物箱' },
    { id: '(O)66', name: 'Amethyst', stack: 2, source: 'chest', sourceLabel: '储物箱' },
  ]);
});

test('parses conservative farm plot summary from farm terrain objects and resource clumps', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>5</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Quiet Farm</farmName>
      </player>
      <locations>
        <GameLocation>
          <name>Farm</name>
          <terrainFeatures>
            <item>
              <key><Vector2><X>12</X><Y>8</Y></Vector2></key>
              <value>
                <TerrainFeature xsi:type="HoeDirt">
                  <crop>
                    <indexOfHarvest>24</indexOfHarvest>
                    <Name>Parsnip</Name>
                  </crop>
                </TerrainFeature>
              </value>
            </item>
            <item>
              <key><Vector2><X>13</X><Y>8</Y></Vector2></key>
              <value>
                <TerrainFeature xsi:type="HoeDirt" />
              </value>
            </item>
          </terrainFeatures>
          <objects>
            <item>
              <key><Vector2><X>14</X><Y>8</Y></Vector2></key>
              <value><Object><name>Stone</name><itemId>390</itemId></Object></value>
            </item>
          </objects>
          <buildings>
            <Building><buildingType>Shed</buildingType></Building>
          </buildings>
          <resourceClumps>
            <ResourceClump><parentSheetIndex>602</parentSheetIndex></ResourceClump>
          </resourceClumps>
        </GameLocation>
        <GameLocation>
          <name>Town</name>
          <terrainFeatures>
            <item>
              <value>
                <TerrainFeature xsi:type="HoeDirt">
                  <crop><indexOfHarvest>188</indexOfHarvest><Name>Green Bean</Name></crop>
                </TerrainFeature>
              </value>
            </item>
          </terrainFeatures>
        </GameLocation>
      </locations>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-20T00:00:00.000Z',
  );

  assert.deepEqual(snapshot.farmPlotSummary, {
    plantedCropCount: 1,
    tilledTileCount: 2,
    occupiedObjectCount: 1,
    resourceClumpCount: 1,
    buildingCount: 1,
    emptyTileCount: 1,
    parsedFields: [
      'locations.GameLocation[name=Farm].terrainFeatures',
      'locations.GameLocation[name=Farm].objects',
      'locations.GameLocation[name=Farm].buildings',
      'locations.GameLocation[name=Farm].resourceClumps',
    ],
    unknownFields: [
      'farmableTileCount',
      'buildingFootprints',
    ],
  });
});

test('parses edible inventory items for exploration food readiness', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>2</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <items>
          <Item>
            <Name>Field Snack</Name>
            <Stack>3</Stack>
            <edibility>18</edibility>
          </Item>
          <Item>
            <Name>Salmonberry</Name>
            <Stack>8</Stack>
            <staminaRecoveredOnConsumption>25</staminaRecoveredOnConsumption>
            <healthRecoveredOnConsumption>11</healthRecoveredOnConsumption>
          </Item>
          <Item>
            <Name>Stone</Name>
            <Stack>30</Stack>
            <edibility>-300</edibility>
          </Item>
        </items>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.deepEqual(snapshot.inventory.map((item) => ({
    name: item.name,
    stack: item.stack,
    isEdible: item.isEdible,
    energy: item.energy,
    health: item.health,
  })), [
    { name: 'Field Snack', stack: 3, isEdible: true, energy: undefined, health: undefined },
    { name: 'Salmonberry', stack: 8, isEdible: true, energy: 25, health: 11 },
    { name: 'Stone', stack: 30, isEdible: false, energy: undefined, health: undefined },
  ]);
});

test('parses items from player backpack and storage chests with source labels', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>2</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <items>
          <Item><Name>Parsnip</Name><Stack>1</Stack><ItemId>24</ItemId></Item>
        </items>
      </player>
      <locations>
        <GameLocation>
          <name>Farm</name>
          <objects>
            <item>
              <value>
                <Object>
                  <Name>Chest</Name>
                  <heldObject>
                    <Chest>
                      <items>
                        <Item><Name>紫水晶</Name><Stack>4</Stack><ItemId>66</ItemId></Item>
                      </items>
                    </Chest>
                  </heldObject>
                </Object>
              </value>
            </item>
          </objects>
        </GameLocation>
        <GameLocation>
          <name>FarmHouse</name>
          <fridge>
            <items>
              <Item>
                <Name>Field Snack</Name>
                <Stack>2</Stack>
                <edibility>18</edibility>
              </Item>
            </items>
          </fridge>
        </GameLocation>
      </locations>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.deepEqual(snapshot.inventory.map((item) => ({
    name: item.name,
    stack: item.stack,
    source: item.source,
    sourceLabel: item.sourceLabel,
    isEdible: item.isEdible,
  })), [
    { name: 'Parsnip', stack: 1, source: 'backpack', sourceLabel: '背包', isEdible: false },
    { name: '紫水晶', stack: 4, source: 'chest', sourceLabel: '储物箱', isEdible: false },
    { name: 'Field Snack', stack: 2, source: 'fridge', sourceLabel: '冰箱', isEdible: true },
  ]);
});

test('parses items from Stardew 1.6 direct chest objects', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <year>1</year>
      <currentSeason>winter</currentSeason>
      <dayOfMonth>5</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <items>
          <Item><Name>Cherry Bomb</Name><Stack>1</Stack><ItemId>286</ItemId></Item>
        </items>
      </player>
      <locations>
        <GameLocation>
          <name>Farm</name>
          <objects>
            <item>
              <value>
                <Object xsi:type="Chest">
                  <name>Chest</name>
                  <itemId>130</itemId>
                  <items>
                    <Item xsi:type="Object">
                      <name>Anchor</name>
                      <itemId>117</itemId>
                      <stack>1</stack>
                    </Item>
                    <Item xsi:type="Object">
                      <name>Crocus</name>
                      <itemId>418</itemId>
                      <stack>5</stack>
                      <quality>2</quality>
                      <edibility>0</edibility>
                    </Item>
                  </items>
                </Object>
              </value>
            </item>
          </objects>
        </GameLocation>
      </locations>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.deepEqual(snapshot.inventory.map((item) => ({
    name: item.name,
    stack: item.stack,
    quality: item.quality,
    source: item.source,
    sourceLabel: item.sourceLabel,
    isEdible: item.isEdible,
  })), [
    { name: 'Cherry Bomb', stack: 1, quality: 0, source: 'backpack', sourceLabel: '背包', isEdible: false },
    { name: 'Anchor', stack: 1, quality: 0, source: 'chest', sourceLabel: '储物箱', isEdible: false },
    { name: 'Crocus', stack: 5, quality: 2, source: 'chest', sourceLabel: '储物箱', isEdible: true },
  ]);
});

test('filters empty inventory slots and falls back to display name or item id', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>2</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <items>
          <Item xsi:nil="true" />
          <Item><DisplayName>紫水晶</DisplayName><Stack>2</Stack><ItemId>66</ItemId></Item>
          <Item><name>Parsnip</name><stack>4</stack><parentSheetIndex>24</parentSheetIndex></Item>
          <Item><ItemId>388</ItemId><Stack>30</Stack></Item>
        </items>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.deepEqual(snapshot.inventory.map((item) => ({
    id: item.id,
    name: item.name,
    stack: item.stack,
  })), [
    { id: '66', name: '紫水晶', stack: 2 },
    { id: '24', name: 'Parsnip', stack: 4 },
    { id: '388', name: '木材', stack: 30 },
  ]);
});

test('resolves qualified item ids through the item catalog', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>2</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <items>
          <Item><QualifiedItemId>(O)66</QualifiedItemId><Stack>1</Stack></Item>
        </items>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.inventory[0].id, '(O)66');
  assert.equal(snapshot.inventory[0].name, '紫水晶');
});

test('parses npc friendship data from friendship entries', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>1</year>
      <currentSeason>spring</currentSeason>
      <dayOfMonth>2</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Sunrise Farm</farmName>
        <friendshipData>
          <item>
            <key><string>Abigail</string></key>
            <value>
              <Friendship>
                <Points>850</Points>
                <GiftsThisWeek>1</GiftsThisWeek>
                <TalkedToToday>true</TalkedToToday>
              </Friendship>
            </value>
          </item>
        </friendshipData>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.relationships[0].npc, 'Abigail');
  assert.equal(snapshot.relationships[0].points, 850);
  assert.equal(snapshot.relationships[0].hearts, 3);
  assert.equal(snapshot.relationships[0].giftsThisWeek, 1);
  assert.equal(snapshot.relationships[0].talkedToday, true);
});

test('parses Stardew 1.6 compact friendships array entries', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>3</year>
      <currentSeason>fall</currentSeason>
      <dayOfMonth>11</dayOfMonth>
      <player>
        <name>Moira</name>
        <farmName>Moja Joja</farmName>
        <friendships>
          <item>
            <key><string>Sebastian</string></key>
            <value>
              <ArrayOfInt>
                <int>3499</int>
                <int>1</int>
                <int>0</int>
                <int>0</int>
                <int>0</int>
                <int>0</int>
              </ArrayOfInt>
            </value>
          </item>
          <item>
            <key><string>Lewis</string></key>
            <value>
              <ArrayOfInt>
                <int>2749</int>
                <int>0</int>
                <int>0</int>
                <int>0</int>
                <int>0</int>
                <int>0</int>
              </ArrayOfInt>
            </value>
          </item>
        </friendships>
      </player>
    </SaveGame>`,
    '/tmp/Moira_133394546',
    '2026-06-20T00:00:00.000Z',
  );

  const sebastian = snapshot.relationships.find((relationship) => relationship.npc === 'Sebastian');
  assert.equal(snapshot.relationships.length, 2);
  assert.equal(sebastian?.points, 3499);
  assert.equal(sebastian?.hearts, 13);
  assert.equal(sebastian?.giftsThisWeek, 1);
});

test('warns about multiplayer saves without blocking core parsing', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>2</year>
      <currentSeason>winter</currentSeason>
      <dayOfMonth>12</dayOfMonth>
      <player>
        <name>Host Farmer</name>
        <farmName>Coop Farm</farmName>
        <money>1400</money>
      </player>
      <farmhands>
        <Farmer>
          <name>Guest Farmer</name>
        </Farmer>
      </farmhands>
    </SaveGame>`,
    '/tmp/Host_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.parseMeta.status, 'ok');
  assert.equal(snapshot.parseMeta.warnings.some((warning) => warning.code === 'unsupported_multiplayer'), true);
  assert.equal(snapshot.farm.playerName, 'Host Farmer');
  assert.equal(snapshot.farm.farmName, 'Coop Farm');
  assert.equal(snapshot.time.year, 2);
  assert.equal(snapshot.time.season, 'winter');
  assert.equal(snapshot.time.day, 12);
  assert.equal(snapshot.wallet.money, 1400);
});

test('returns failed parse meta when required date fields are missing', () => {
  const snapshot = parseStardewSaveXml('<SaveGame><player /></SaveGame>', '/tmp/bad', '2026-06-18T00:00:00.000Z');

  assert.equal(snapshot.parseMeta.status, 'failed');
  assert.equal(snapshot.parseMeta.warnings.some((warning) => warning.code === 'missing_field'), true);
});

test('treats a completed regular mine plus desert access as skull cavern access', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>2</year>
      <currentSeason>summer</currentSeason>
      <dayOfMonth>8</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Late Farm</farmName>
        <deepestMineLevel>120</deepestMineLevel>
        <mailReceived>
          <string>ccVault</string>
        </mailReceived>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.farm.hasDesertAccess, true);
  assert.equal(snapshot.farm.hasSkullCavernAccess, true);
});

test('keeps skull cavern closed when the mine is complete but desert is not accessible', () => {
  const snapshot = parseStardewSaveXml(
    `<?xml version="1.0" encoding="utf-8"?>
    <SaveGame>
      <year>1</year>
      <currentSeason>winter</currentSeason>
      <dayOfMonth>1</dayOfMonth>
      <player>
        <name>Farmer</name>
        <farmName>Mine Farm</farmName>
        <deepestMineLevel>120</deepestMineLevel>
      </player>
    </SaveGame>`,
    '/tmp/Farmer_123456',
    '2026-06-18T00:00:00.000Z',
  );

  assert.equal(snapshot.farm.hasDesertAccess, false);
  assert.equal(snapshot.farm.hasSkullCavernAccess, false);
});

test('locks key fields from local real saves when available', () => {
  const saveCases = [
    {
      path: '/Users/fuukangun/.config/StardewValley/Saves/fun_440336724/fun_440336724',
      expected: {
        farmName: 'fun',
        year: 1,
        season: 'spring',
        day: 1,
        route: 'unknown',
        mineLevel: 0,
        desert: false,
        island: false,
        skull: false,
        volcano: false,
      },
    },
    {
      path: '/Users/fuukangun/.config/StardewValley/Saves/Fonsa_399159995/Fonsa_399159995',
      expected: {
        farmName: 'Fazenda Á',
        year: 7,
        season: 'summer',
        day: 8,
        route: 'community_center',
        mineLevel: 120,
        skullCavernLevel: 127,
        desert: true,
        island: true,
        skull: true,
        volcano: true,
        communityCenterPercentage: 100,
        completedBundles: 31,
      },
      minimumRelationships: 30,
      minimumInventoryItems: 500,
    },
    {
      path: '/Users/fuukangun/.config/StardewValley/Saves/Arkon_255003282/Arkon_255003282',
      expected: {
        farmName: 'Vanilla',
        year: 6,
        season: 'winter',
        day: 14,
        route: 'community_center',
        mineLevel: 120,
        skullCavernLevel: 272,
        desert: true,
        island: true,
        skull: true,
        volcano: true,
        communityCenterPercentage: 100,
        completedBundles: 31,
      },
      minimumRelationships: 30,
      minimumInventoryItems: 1000,
    },
    {
      path: '/Users/fuukangun/.config/StardewValley/Saves/菌菇_414673714/菌菇_414673714',
      expected: {
        farmName: '菌菇',
        year: 1,
        season: 'winter',
        day: 23,
        route: 'community_center',
        mineLevel: 80,
        desert: false,
        island: false,
        skull: false,
        volcano: false,
        communityCenterPercentage: 27,
        completedBundles: 10,
      },
      minimumRelationships: 30,
      minimumInventoryItems: 150,
    },
    {
      path: '/Users/fuukangun/.config/StardewValley/Saves/Moira_133394546/Moira_133394546',
      expected: {
        farmName: 'Moja Joja',
        year: 3,
        season: 'fall',
        day: 11,
        route: 'joja',
        mineLevel: 120,
        skullCavernLevel: 36,
        desert: true,
        island: false,
        skull: true,
        volcano: false,
        jojaCompletedProjects: 5,
      },
      minimumRelationships: 30,
      minimumInventoryItems: 100,
    },
  ] as const;

  const availableCases = saveCases.filter((saveCase) => existsSync(saveCase.path));
  if (availableCases.length === 0) {
    return;
  }

  for (const saveCase of availableCases) {
    const snapshot = parseStardewSaveXml(
      readFileSync(saveCase.path, 'utf8'),
      saveCase.path,
      statSync(saveCase.path).mtime.toISOString(),
    );

    assert.equal(snapshot.farm.farmName, saveCase.expected.farmName);
    assert.equal(snapshot.time.year, saveCase.expected.year);
    assert.equal(snapshot.time.season, saveCase.expected.season);
    assert.equal(snapshot.time.day, saveCase.expected.day);
    assert.equal(snapshot.farm.communityCenterRoute, saveCase.expected.route);
    assert.equal(snapshot.farm.mineLevel, saveCase.expected.mineLevel);
    if ('skullCavernLevel' in saveCase.expected) {
      assert.equal(snapshot.farm.skullCavernLevel, saveCase.expected.skullCavernLevel);
    }
    assert.equal(snapshot.farm.hasIslandAccess, saveCase.expected.island);
    assert.equal(snapshot.farm.hasSkullCavernAccess, saveCase.expected.skull);
    assert.equal(snapshot.farm.hasVolcanoDungeonAccess, saveCase.expected.volcano);
    if ('desert' in saveCase.expected) {
      assert.equal(snapshot.farm.hasDesertAccess, saveCase.expected.desert);
    }
    if ('communityCenterPercentage' in saveCase.expected) {
      assert.equal(snapshot.progression.communityCenter?.percentage, saveCase.expected.communityCenterPercentage);
    }
    if ('completedBundles' in saveCase.expected) {
      assert.equal(
        snapshot.progression.communityCenter?.bundleStates?.filter((state) => state.completed).length,
        saveCase.expected.completedBundles,
      );
    }
    if ('jojaCompletedProjects' in saveCase.expected) {
      assert.equal(snapshot.progression.joja?.completedProjects, saveCase.expected.jojaCompletedProjects);
    }
    if (saveCase.expected.farmName === 'Moja Joja') {
      assert.equal(snapshot.player.equipment.weaponName, 'Galaxy Sword');
      assert.deepEqual(snapshot.player.equipment.ringNames, ['Iridium Band', "Burglar's Ring"]);
      assert.equal(formatEquipmentName(snapshot.player.equipment.weaponName, 'zh-CN'), '银河剑');
      assert.equal(formatEquipmentList(snapshot.player.equipment.ringNames, '未装备', 'zh-CN'), '铱环、窃贼戒指');
    }
    if ('minimumRelationships' in saveCase) {
      assert.equal(snapshot.relationships.length >= saveCase.minimumRelationships, true);
    }
    if ('minimumInventoryItems' in saveCase) {
      assert.equal(snapshot.inventory.length >= saveCase.minimumInventoryItems, true);
    }
  }
});
