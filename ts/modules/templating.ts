import * as jade from "pug"

export class templating{
	options:{
		filePath:string
	}

	constructor( filePathOrOptions ){
		switch(typeof filePathOrOptions){
			case 'string':
				this.options = {filePath:filePathOrOptions}
				break;

			default:this.options = filePathOrOptions || {}
		}
	}

	compile(){
		return jade.compileFile(this.options.filePath, this.options)
	}

	render(locals){
		return jade.renderFile(this.options.filePath, locals)
	}
}

export function method(filePathOrOptions):templating{
	return new templating(filePathOrOptions)
}