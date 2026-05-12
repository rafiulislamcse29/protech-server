import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

import AppError from "../errorHelpers/AppError";
import status from "http-status";
import { config } from "./index";

cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
})


export const uploadFileToCloudinary = async (
    buffer: Buffer,
    fileName: string,
): Promise<UploadApiResponse> => {

    if (!buffer || !fileName) {
        throw new AppError("File buffer and file name are required for upload", status.BAD_REQUEST);
    }

    const extension = fileName.split(".").pop()?.toLocaleLowerCase();

    const fileNameWithoutExtension = fileName
        .split(".")
        .slice(0, -1)
        .join(".")
        .toLowerCase()
        .replace(/\s+/g, "-")
        // eslint-disable-next-line no-useless-escape
        .replace(/[^a-z0-9\-]/g, "");

    const uniqueName =
        Math.random().toString(36).substring(2) +
        "-" +
        Date.now() +
        "-" +
        fileNameWithoutExtension;

    const folder = extension === "pdf" ? "pdfs" : "images";


    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                resource_type: "auto",
                public_id: `ecovault/${folder}/${uniqueName}`,
                folder: `ecovault/${folder}`,
            },
            (error: any, result: any) => {
                if (error) {
                    return reject(new AppError("Failed to upload file to Cloudinary", status.INTERNAL_SERVER_ERROR));
                }
                resolve(result as UploadApiResponse);
            }
        ).end(buffer);
    })
}

export const deleteFileFromCloudinary = async (url: string) => {

    try {
        const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;

        const match = url.match(regex);

        if (match && match[1]) {
            const publicId = match[1];

            await cloudinary.uploader.destroy(
                publicId, {
                resource_type: "image"
            }
            )

            console.log(`File ${publicId} deleted from cloudinary`);
        }

    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        throw new AppError("Failed to delete file from Cloudinary", status.INTERNAL_SERVER_ERROR);
    }
}


export const cloudinaryUpload = cloudinary