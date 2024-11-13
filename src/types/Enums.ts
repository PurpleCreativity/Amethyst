export enum CommandError {
  DEVELOPER_ONLY = "DEVELOPER_ONLY",
  DISABLED_GLOBAL = "DISABLED_GLOBAL",

  MISSING_DISCORD_PERMISSIONS = "MISSING_DISCORD_PERMISSIONS",
  MISSING_PERMISSIONS = "MISSING_PERMISSIONS",

  DATABASE_ERROR = "DATABASE_ERROR",

  UNKNOWN = "UNKNOWN",
}

export enum CommandErrorDescription {
  DEVELOPER_ONLY = "This command is for Amethyst developers only",
  DISABLED_GLOBAL = "This command is currently disabled",

  MISSING_DISCORD_PERMISSIONS = "You are missing the required Discord permissions to run this command",
  MISSING_PERMISSIONS = "You are missing the required Amethyst permissions to run this command",

  DATABASE_ERROR = "An error occurred while trying to access the database",

  UNKNOWN = "An unknown error occurred",
}

export enum CommandModule {
  Points = "Points",
  Schedule = "Schedule",
  Roblox = "Roblox",
  Developer = "Developer",
}
