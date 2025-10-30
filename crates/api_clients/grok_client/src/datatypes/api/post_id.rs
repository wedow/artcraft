
/// Type for Post IDs. 
/// Post IDs are UUIds. 
/// These are often shared with media/image uploads' `FileId`s, but seldom video generation `FileId`s
#[derive(Clone, Debug)]
pub struct PostId(pub String);
