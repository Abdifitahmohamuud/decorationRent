import { supabase } from "./supabase.js";
import { v4 as uuidv4 } from "uuid";

export const uploadToSupabase = async (file, folder = "products") => {
  const fileExtension = file.originalname.split(".").pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("decorations") // Make sure this bucket exists in your Supabase project
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from("decorations")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

export const deleteFromSupabase = async (url) => {
  const path = url.split("/").slice(-2).join("/"); // folder/filename
  const { error } = await supabase.storage.from("decorations").remove([path]);
  if (error) {
    console.error("Error deleting from Supabase:", error);
  }
};
