import os


def upload_file_to_s3(local_path, s3_filename):
    """
    S3 upload is disabled - using local storage instead.
    Returns None to indicate S3 is not configured.
    """
    print(f"[StorageService] S3 not configured. File stays local: {local_path}")
    return None