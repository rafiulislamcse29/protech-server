import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";
import multer from "multer";

const storage = new CloudinaryStorage({
    cloudinary: cloudinaryUpload,
    params: async (req, file) => {
        const originName = file.originalname;
        const extension = originName.split(".").pop()?.toLocaleLowerCase()

        const fileNameWithoutExtension = originName.split('.').slice(0, -1).join(".").toLocaleLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

        const uniqueName =
            Math.random().toString(36).substring(2) +
            "-" +
            Date.now() +
            "-" +
            fileNameWithoutExtension;

        const folder = extension === "pdf" ? "pdfs" : "images";

        return {
            folder: `proptech/${folder}`,
            public_id: uniqueName,
            resource_type: "auto"
        }

    }
})


export const multerUpload = multer({ storage })