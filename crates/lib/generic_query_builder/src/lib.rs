extern crate proc_macro;

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, FieldsNamed, Type};


#[proc_macro_derive(PaginatedQueryBuilders)]
pub fn builder_methods_derive(input: TokenStream) -> TokenStream {
  let input = parse_macro_input!(input as DeriveInput);
  let name = &input.ident;

  let fields = if let syn::Data::Struct(syn::DataStruct {
                                          fields: syn::Fields::Named(FieldsNamed { named, .. }),
                                          ..
                                        }) = &input.data
  {
    named
  } else {
    panic!("PaginatedQueryBuilders can only be derived for structs with named fields");
  };

    let methods = fields.iter().map(|field| {
        let field_name = &field.ident;
        let field_type = &field.ty;

        match field_type {
            Type::Reference(_) => {
                // Handle Option<&T> type
                quote! {
                    fn #field_name(mut self, #field_name: Option<&str>) -> Self {
                        self.#field_name = #field_name.map(|s| s.to_string());
                        self
                    }
                }
            },
            Type::Path(type_path) if type_path.path.segments.last().map_or(false, |seg| seg.ident == "Option") => {
                // Handle Option<T> type
                quote! {
                    fn #field_name(mut self, #field_name: #field_type) -> Self {
                        self.#field_name = #field_name;
                        self
                    }
                }
            },
            _ => {
                // Handle other types
                quote! {
                    fn #field_name(mut self, #field_name: #field_type) -> Self {
                        self.#field_name = #field_name;
                        self
                    }
                }
            }
        }
    });

  let expanded = quote! {
        impl PaginatedQueryBuilders for #name {
            #(#methods)*
        }
    };

  TokenStream::from(expanded)
}
