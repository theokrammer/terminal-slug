/**
 * Terminal Slug - ASCII Art Assets & Frame Sprites
 * Handcrafted monospaced art for characters, vehicles, enemies, and FX
 */

export const ASCII_TITLE = [
  "  _____ ___ ____  __  __ ___ _   _    _    _       ____  _    _   _  ____ ",
  " |_   _| __|  _ \\|  \\/  |_ _| \\ | |  / \\  | |     / ___|| |  | | | |/ ___|",
  "   | | |  _| |_) | |\\/| || ||  \\| | / _ \\ | |     \\___ \\| |  | | | | |  _ ",
  "   | | | |___| _ <| |  | || || |\\  |/ ___ \\| |___   ___) | |__| |_| | |_| |",
  "   |_| |___|_| \\_\\_|  |_|___|_| \\_/_/   \\_\\_____| |____/|_____\\___/ \\____|",
  "        >>> MISSION 1: OPERATION DESERT STRIKE <<< [VER 1.0.4]          "
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

// Enemies
export const ENEMY_FRAMES = {
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
  chopper: [
    "   ====+====   ",
    "  /  [o_o]  \\  ",
    " [==|REBEL|==] ",
    "     /   \\     ",
    "    =     =    "
  ],
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

// Boss: "IRON NOKANA" Heavy Siege Fortress Tank
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
  ]
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
