export interface SwappedPage {
    page: number;
    image_url: string;
}

export interface FaceSwapResponse {
    success: boolean;
    pages?: SwappedPage[];
    error?: string;
}

/**
 * Calls the backend /api/face-swap endpoint to parallelly swap character faces
 * in template images using the provided baby image.
 * 
 * @param babyImage File object representing the baby's photo
 * @param templateUrls Array of template image URLs to swap faces on
 * @returns FaceSwapResponse with the swapped image URLs
 */
export async function swapFaces(babyImage: File, templateUrls: string[]): Promise<FaceSwapResponse> {
    try {
        const formData = new FormData();
        formData.append("baby_image", babyImage);
        // Send URLs as a JSON string so FastAPI Form(...) can parse it
        formData.append("template_urls", JSON.stringify(templateUrls));

        // We assume backend is running on localhost:8000 for development.
        // Replace with your production URL when deploying.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const response = await fetch(`${apiUrl}/face-swap`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: `Upload failed: ${errorText}` };
        }

        const data: FaceSwapResponse = await response.json();
        return data;
    } catch (error: any) {
        console.error("Face swap API error:", error);
        return { success: false, error: error.message || "An error occurred during face swap" };
    }
}
