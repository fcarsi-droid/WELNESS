import { pgTable, text, integer, boolean, timestamp, real, pgEnum, serial } from "drizzle-orm/pg-core";

// Enums
export const moodLevelEnum = pgEnum("mood_level", ["1","2","3","4","5"]);
export const bookStatusEnum = pgEnum("book_status", ["available","borrowed","reserved"]);
export const loanStatusEnum = pgEnum("loan_status", ["requested","active","returned","cancelled"]);
export const userRoleEnum = pgEnum("user_role", ["user","admin"]);
export const userStatusEnum = pgEnum("user_status", ["pending","active","banned"]);
export const resourceTypeEnum = pgEnum("resource_type", ["article","video","link","podcast"]);

// Users
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  role: userRoleEnum("role").default("user").notNull(),
  status: userStatusEnum("status").default("pending").notNull(),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Auth
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at"),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

// Mood
export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  level: moodLevelEnum("level").notNull(),
  note: text("note"),
  date: text("date").notNull(),
  time: text("time"), // HH:MM — allows multiple entries per day
  reflection: text("reflection"), // "O que aconteceu?"
  learning: text("learning"), // "O que você aprendeu sobre si mesmo hoje?"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sleep
export const sleepEntries = pgTable("sleep_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bedtime: text("bedtime").notNull(),
  wakeTime: text("wake_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  quality: integer("quality"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Hydration
export const hydrationEntries = pgTable("hydration_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  glasses: integer("glasses").notNull().default(0),
  goalGlasses: integer("goal_glasses").notNull().default(8),
  date: text("date").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Calories
export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  caloriesPer100g: real("calories_per_100g").notNull(),
  isDefault: boolean("is_default").default(false),
  createdBy: text("created_by").references(() => users.id),
});

export const calorieEntries = pgTable("calorie_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  foodItemId: integer("food_item_id").references(() => foodItems.id),
  foodName: text("food_name").notNull(),
  calories: real("calories").notNull(),
  grams: real("grams"),
  meal: text("meal"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calorieGoals = pgTable("calorie_goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  dailyGoal: real("daily_goal").notNull().default(2000),
});

// Recipes
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  ingredients: text("ingredients").notNull(),
  instructions: text("instructions").notNull(),
  category: text("category"),
  prepTimeMinutes: integer("prep_time_minutes"),
  calories: real("calories"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipeComments = pgTable("recipe_comments", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipeRatings = pgTable("recipe_ratings", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
});

export const recipeLikes = pgTable("recipe_likes", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

// Wellness Resources
export const wellnessResources = pgTable("wellness_resources", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  type: resourceTypeEnum("type").notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resourceLikes = pgTable("resource_likes", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => wellnessResources.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

// Community Feed
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cultural Groups
export const culturalCategories = pgTable("cultural_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  isDefault: boolean("is_default").default(false),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const culturalGroups = pgTable("cultural_groups", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => culturalCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const culturalGroupMembers = pgTable("cultural_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => culturalGroups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const culturalPosts = pgTable("cultural_posts", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => culturalGroups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const culturalPostLikes = pgTable("cultural_post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => culturalPosts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const culturalPostComments = pgTable("cultural_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => culturalPosts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cultural Events
export const culturalEvents = pgTable("cultural_events", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => culturalGroups.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  eventDate: timestamp("event_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => culturalEvents.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Book Club - Library
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  type: text("type"),
  status: bookStatusEnum("status").default("available").notNull(),
  notes: text("notes"),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookLoans = pgTable("book_loans", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  requesterId: text("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: loanStatusEnum("status").default("requested").notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  returnedAt: timestamp("returned_at"),
  notes: text("notes"),
});

// Book Club - Reading & Voting
export const bookClubReadings = pgTable("book_club_readings", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").references(() => books.id),
  externalTitle: text("external_title"),
  externalAuthor: text("external_author"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookClubVotes = pgTable("book_club_votes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookClubVoteChoices = pgTable("book_club_vote_choices", {
  id: serial("id").primaryKey(),
  voteId: integer("vote_id").notNull().references(() => bookClubVotes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const readingProgress = pgTable("reading_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readingId: integer("reading_id").notNull().references(() => bookClubReadings.id, { onDelete: "cascade" }),
  currentPage: integer("current_page").default(0),
  totalPages: integer("total_pages"),
  finished: boolean("finished").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookReviews = pgTable("book_reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readingId: integer("reading_id").notNull().references(() => bookClubReadings.id, { onDelete: "cascade" }),
  rating: integer("rating"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
