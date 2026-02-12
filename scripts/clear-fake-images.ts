/**
 * Script to clear fake placeholder images from news articles
 * Run with: npx tsx scripts/clear-fake-images.ts
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/arl_intranet";

async function clearFakeImages() {
  try {
    console.log("Connecting to MongoDB...");
    console.log("URI:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!");

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    // Check news count
    const newsCount = await mongoose.connection.db.collection("news").countDocuments();
    console.log(`Found ${newsCount} news articles`);

    // Find news with images
    const newsWithImages = await mongoose.connection.db.collection("news").find({ featuredImage: { $ne: null } }).toArray();
    console.log(`News with images: ${newsWithImages.length}`);
    if (newsWithImages.length > 0) {
      console.log("Sample image URL:", newsWithImages[0].featuredImage);
    }

    // Clear featuredImage from all News documents using $unset
    const newsResult = await mongoose.connection.db.collection("news").updateMany(
      { featuredImage: { $ne: null } },
      { $unset: { featuredImage: "" } }
    );
    console.log(`Cleared featuredImage from ${newsResult.modifiedCount} news articles`);

    // Clear featuredImage from all Events documents
    const eventsResult = await mongoose.connection.db.collection("events").updateMany(
      { featuredImage: { $ne: null } },
      { $unset: { featuredImage: "" } }
    );
    console.log(`Cleared featuredImage from ${eventsResult.modifiedCount} events`);

    // Clear images from PSI Talks
    const toolboxResult = await mongoose.connection.db.collection("toolboxtalks").updateMany(
      { featuredMedia: { $ne: null } },
      { $unset: { featuredMedia: "" } }
    );
    console.log(`Cleared featuredMedia from ${toolboxResult.modifiedCount} PSI talks`);

    // Clear images from Safety Tips
    const safetyTipsResult = await mongoose.connection.db.collection("safetytips").updateMany(
      { featuredImage: { $ne: null } },
      { $unset: { featuredImage: "" } }
    );
    console.log(`Cleared featuredImage from ${safetyTipsResult.modifiedCount} safety tips`);

    // Clear images from Safety Videos
    const safetyVideosResult = await mongoose.connection.db.collection("safetyvideos").updateMany(
      {},
      { $unset: { thumbnail: "", videoUrl: "" } }
    );
    console.log(`Cleared thumbnail from ${safetyVideosResult.modifiedCount} safety videos`);

    // Clear images from Albums
    const albumsResult = await mongoose.connection.db.collection("albums").updateMany(
      { coverImage: { $ne: null } },
      { $unset: { coverImage: "" } }
    );
    console.log(`Cleared coverImage from ${albumsResult.modifiedCount} albums`);

    // Clear all photos
    const photosResult = await mongoose.connection.db.collection("photos").deleteMany({});
    console.log(`Deleted ${photosResult.deletedCount} photos`);

    console.log("\nDone! All fake placeholder images have been cleared.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

clearFakeImages();
