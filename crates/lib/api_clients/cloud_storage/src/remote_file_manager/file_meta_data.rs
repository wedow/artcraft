#[derive(Debug, Clone)]
pub struct FileMetaData {
    pub file_size_bytes: u64,
    pub sha256_checksum: String,
    pub mimetype: String
}
