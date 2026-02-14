

export const create = async ({model, data} = {}) => {
   return await model.create( data )
}

export const findOne = async ({model, filter = {}, options = {}, select = "" } = {}) => {
   const doc =  model.findOne( filter ).select(select)
   if(options.populate){
        doc.populate(options.populate)
   }
   if(options.skip){
        doc.skip(options.skip)
   }
   if(options.limit){
        doc.limit(options.limit)
   }
   return await doc.exec()
}

export const findById = async({model, id, select = {}}) => {
   return await model.findById(id).select(select)
}