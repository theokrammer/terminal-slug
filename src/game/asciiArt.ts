/**
 * Terminal Slug - ASCII Art Assets & Frame Sprites
 * Handcrafted monospaced art for characters, vehicles, enemies, bosses, biomes, and FX
 */

export const ASCII_TITLE = [
  "  _____ ___ ____  __  __ ___ _   _    _    _       ____  _    _   _  ____ ",
  " |_   _| __|  _ \\|  \\/  |_ _| \\ | |  / \\  | |     / ___|| |  | | | |/ ___|",
  "   | | |  _| |_) | |\\/| || ||  \\| | / _ \\ | |     \\___ \\| |  | | | | |  _ ",
  "   | | | |___| _ <| |  | || || |\\  |/ ___ \\| |___   ___) | |__| |_| | |_| |",
  "   |_| |___|_| \\_\\_|  |_|___|_| \\_/_/   \\_\\_____| |____/|_____\\___/ \\____|",
  "        >>> OPERATION DESERT STRIKE · THE EXPANDED WAR THEATER <<<          "
];

export const ASCII_SLUG_LOGO = [
  "      __====____      ",
  "    /   _  _   \\==#== ",
  "  =(   (o)(o)   )=::  ",
  "    \\__________/      ",
  "    [O--O--O--O]      "
];

// Player (Marco) animations
export const PLAYER_FRAMES = {
  idleRight: [
    "  [o_o]  ",
    " --|#|==>",
    "   / \\   "
  ],
  idleLeft: [
    "  [o_o]  ",
    "<==|#|-- ",
    "   / \\   "
  ],
  runRight1: [
    "  [o_o]  ",
    " --|#|==>",
    "   /  |  "
  ],
  runRight2: [
    "  [o_o]  ",
    " --|#|==>",
    "   |  \\  "
  ],
  runLeft1: [
    "  [o_o]  ",
    "<==|#|-- ",
    "   |  \\  "
  ],
  runLeft2: [
    "  [o_o]  ",
    "<==|#|-- ",
    "   /  |  "
  ],
  jumpRight: [
    "  [o_o]  ",
    " \\-|#|==>",
    "   < >   "
  ],
  jumpLeft: [
    "  [o_o]  ",
    "<==|#|-/ ",
    "   < >   "
  ],
  crouchRight: [
    "         ",
    "  [o_o]  ",
    " -_|_|==>"
  ],
  crouchLeft: [
    "         ",
    "  [o_o]  ",
    "<==|_|_- "
  ],
  aimUpRight: [
    "  [o_o]^ ",
    " --|#| | ",
    "   / \\   "
  ],
  aimUpLeft: [
    " ^[o_o]  ",
    " | |#|-- ",
    "   / \\   "
  ],
  meleeRight: [
    "  [o_o]  ",
    " --|#|)=>>",
    "   / \\   "
  ],
  meleeLeft: [
    "  [o_o]  ",
    "<<=(|#|--",
    "   / \\   "
  ],
  dead: [
    "         ",
    "  x_x    ",
    " --|_|__ "
  ]
};

// SV-001 METAL SLUG Tank
export const SLUG_FRAMES = {
  rightNormal: [
    "       ___====\\==      ",
    "     /  _   _  \\===#   ",
    "    (  [o] [o]  )      ",
    "    /===========/      ",
    "   (O--O--O--O--O)     "
  ],
  rightAimUp: [
    "       ___====/ ^      ",
    "     /  _   _// #      ",
    "    (  [o] [o]  )      ",
    "    /===========/      ",
    "   (O--O--O--O--O)     "
  ],
  leftNormal: [
    "      ==/====___       ",
    "   #===\\  _   _  \\     ",
    "      (  [o] [o]  )    ",
    "      \\===========     ",
    "     (O--O--O--O--O)   "
  ],
  leftAimUp: [
    "      ^ \\====___       ",
    "      # \\\\_   _  \\     ",
    "      (  [o] [o]  )    ",
    "      \\===========     ",
    "     (O--O--O--O--O)   "
  ],
  wreck: [
    "      *  #   %  *      ",
    "     /x_x_x_x_x_\\      ",
    "    (   CRASHED  )     ",
    "    /===========/      ",
    "   (X--X--X--X--X)     "
  ]
};

// Enemy Roster Frames
export const ENEMY_FRAMES = {
  // 1. Grunts
  gruntRight: [
    "  {•_•}  ",
    " --|#|-> ",
    "   / \\   "
  ],
  gruntLeft: [
    "  {•_•}  ",
    " <-|#|-- ",
    "   / \\   "
  ],

  // 2. Slasher
  slasherChargeRight: [
    "  {>_<}  ",
    " --|#|)=>",
    "   //    "
  ],
  slasherChargeLeft: [
    "  {>_<}  ",
    " <=(|#|--",
    "    \\\\   "
  ],

  // 3. Arabian Swordsman (Acrobatic leap and dual scimitars)
  swordsmanRight: [
    "  {ò_ó}  ",
    " //|#|\\\\ ",
    "   / \\   "
  ],
  swordsmanLeft: [
    "  {ò_ó}  ",
    " //|#|\\\\ ",
    "   / \\   "
  ],
  swordsmanLeap: [
    "  {ò_ó}  ",
    " --|#|--)",
    "   < >   "
  ],

  // 4. Rifleman
  riflemanAimRight: [
    "  {•_•}  ",
    " --|#|===",
    "   _\\    "
  ],
  riflemanAimLeft: [
    "  {•_•}  ",
    "===|#|-- ",
    "    /_   "
  ],

  // 5. Sniper (Long barrel and laser scope)
  sniperRight: [
    "  [•-•]  ",
    " --|#|========*",
    "   _\\    "
  ],
  sniperLeft: [
    "  [•-•]  ",
    "*========|#|-- ",
    "    /_   "
  ],

  // 6. Bazooka
  bazookaAimRight: [
    "  {•_•}[]",
    " --|#|===",
    "   / \\   "
  ],
  bazookaAimLeft: [
    "[]{•_•}  ",
    "===|#|-- ",
    "   / \\   "
  ],

  // 7. Mortar Trooper (Kneeling with mortar tube)
  mortarRight: [
    "   {•_•} / ",
    "  --|#|-[|]",
    "    _\\  /  "
  ],
  mortarLeft: [
    " \\ {•_•}   ",
    "[|]-|#|--  ",
    "  \\  /_    "
  ],

  // 8. Shield Trooper
  shieldRight: [
    "  {•_•}|#|",
    " --|#| |#|",
    "   / \\ |#|"
  ],
  shieldLeft: [
    "|#|{•_•}  ",
    "|#| |#|-- ",
    "|#| / \\   "
  ],

  // 9. Gatling Juggernaut (Heavy Armor Commando)
  gatlingRight: [
    "  [X_X]   ",
    " =#{###}::==#",
    "   /   \\  "
  ],
  gatlingLeft: [
    "   [X_X]  ",
    "#==::{###}#=",
    "   /   \\  "
  ],

  // 10. Paratrooper with Parachute
  paratrooperChute: [
    "  /-------\\  ",
    " (  REBEL  ) ",
    "  \\ \\ | / /  ",
    "    {•_•}    ",
    "   --|#|--   ",
    "     / \\     "
  ],
  paratrooperLanded: [
    "   {•_•}   ",
    "  --|#|==> ",
    "    / \\    "
  ],

  // 11. Rolling Drone Mine (Kamikaze)
  droneMine1: [
    " (o)X(o) ",
    "  /===\\  "
  ],
  droneMine2: [
    " (•)!(•) ",
    "  \\===/  "
  ],

  // 12. Automated Platform Security Turret
  turretRight: [
    "  [•]===#  ",
    " /=======\\ "
  ],
  turretLeft: [
    "  #===[•]  ",
    " /=======\\ "
  ],
  turretUp: [
    "   / ^ \\   ",
    "  [ |#| ]  ",
    " /=======\\ "
  ],

  // 13. Rebel Dive-Bomber Jet
  airJet: [
    " <=======\\=====/=======> ",
    "   [==|REBEL AIR|==]     ",
    "       \\===V===/         "
  ],

  // 14. Attack Chopper
  chopper: [
    "   ====+====   ",
    "  /  [o_o]  \\  ",
    " [==|REBEL|==] ",
    "     /   \\     ",
    "    =     =    "
  ],

  // 15. Armored Buggy
  buggyRight: [
    "    [•_•]==#   ",
    "   /________\\  ",
    "  (O)======(O) "
  ],
  buggyLeft: [
    "   #==[•_•]    ",
    "  /________\\   ",
    "  (O)======(O) "
  ]
};

// Boss 1: "IRON NOKANA" Heavy Siege Fortress Tank
export const BOSS_NOKANA = [
  "   [!]==============[ IRON NOKANA ]==============[!]   ",
  "      /   [•_•]   \\       /===#  #===\\                 ",
  "  ___/____________\\______/____________\\______________  ",
  " | [X] [TURRET-A]     (O) (O)      [TURRET-B] [FLAME] |",
  " |====================================================|",
  " |  [#] [#] [#] [#] [#] [#] [#] [#] [#] [#] [#] [#]   |",
  " |====================================================|",
  " (OOO)==========================================(OOO)  "
];

// Boss 2: "TETSUYUKI" Heavy Flying Fortress Gunship
export const BOSS_TETSUYUKI = [
  "       <==============[ TETSUYUKI FLYING FORTRESS ]==============>       ",
  "    /====\\       /---------------------------------\\       /====\\    ",
  "   [TURBINE]====[======[O]====[O]====[O]=====[O]======]====[TURBINE]  ",
  "    \\====/       \\_______/                 \\_______/       \\====/    ",
  "       ||         | [FLAK-L]   [BOMB-BAY]   [FLAK-R] |         ||        ",
  "   <===++=========[==================================]=========++===>   ",
  "                   \\  (o)   (o)   (o)   (o)   (o)   /                    ",
  "                    \\______________________________/                     "
];

// POW (Prisoner of War)
export const POW_FRAMES = {
  tied: [
    "   _~_   ",
    "  (#_#)  ",
    "  /|X|\\  ",
    "   / \\   "
  ],
  free: [
    "   ~*~   ",
    "  (^o^)  ",
    "  \\|#|/  ",
    "   / \\   "
  ],
  salute: [
    "   ~*~   ",
    "  (^o^)7 ",
    "   |#|   ",
    "   / \\   "
  ]
};

// Destructibles & Obstacles
export const OBSTACLES = {
  sandbag: [
    " [#####] ",
    "[#######]"
  ],
  barrel: [
    " +-----+ ",
    " | TNT | ",
    " +-----+ "
  ],
  crate: [
    " +=====+ ",
    " |\\   /| ",
    " |/   \\| ",
    " +=====+ "
  ],
  watchtower: [
    " [| SNIPER NEST |] ",
    " +===============+ ",
    "   |   |   |   |   ",
    "   |   |   |   |   ",
    " [| CATWALK LV1 |] ",
    " +===============+ ",
    "   |   |   |   |   ",
    "   |   |   |   |   "
  ],
  generator: [
    " +---[PWR]---+ ",
    " | [⚡]  [⚡] | ",
    " +-----------+ "
  ]
};

// Hazards
export const HAZARD_ART = {
  spikes: "^^^^^^^^^^^^",
  acid: "~~~~[ACID]~~~~",
  landmine: "[!MINE!]"
};

// Pickups
export const PICKUPS = {
  HMG: "[ H ]",
  SHOTGUN: "[ S ]",
  ROCKET: "[ R ]",
  FLAME: "[ F ]",
  LASER: "[ L ]",
  BOMB: "[BOMB]",
  MEDKIT: "[ + ]",
  COIN: "[$]",
  GOLD_BAR: "[GOLD]"
};

// Explosion frames (expansion and dissipation)
export const EXPLOSION_FRAMES = [
  [
    "  *  "
  ],
  [
    " ( * ) ",
    "  * *  "
  ],
  [
    " / # \\ ",
    "{ % @ }",
    " \\ # / "
  ],
  [
    " . : * % : . ",
    ": # @ @ @ # :",
    " ' : * % : ' "
  ],
  [
    "  .   '   *   '   .  ",
    " '     #  .  #     ' ",
    "  .   '   *   '   .  "
  ],
  [
    "   .     .     .     ",
    "      .     .        "
  ]
];
