/// Type for Object IDs. 
/// These are used to create inference runs and refer to the result
/// These appear to be bare UUIDs.
#[derive(Clone, Debug)]
pub struct RunObjectId(pub String);
