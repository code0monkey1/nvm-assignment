#----- 
# STAGE 1 [ Pre-Prod Image building step ( the dist folder created from this stage will be used to build prod image in stage 2 ) ]
#----- 

FROM node:18-alpine AS builder 
# the alpine version of node is the lighest node version specifically used for generating prod docker images

WORKDIR /app
# this is the directory inside the image where all the contents will be copied to

COPY package*.json ./
# ( LHS represents your file system , RHS is image file system (i.e /app folder ) )
# Here , the package.json and package.lock.json is copied into the /app folder of the image 

RUN npm ci --ignore-scripts
# The `ci` ensures that it installs the exact version of packages as mentioned in the package.lock.json file

COPY . .
# ( LHS represents your file system , RHS is image file system (i.e /app folder ) )

RUN npm run build
# This is the command defined in our package.json folder , to build the TS project to a JS project (i.e transpiling using TSC)
# After this we will get the `dist` folder with the js version of the project which will be used in production

#----- 
# STAGE 2 [ Building Production Image ]
#----- 

FROM node:18-alpine AS production

ENV NODE_ENV=prod

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts
# The ignore scripts flag helps us ignore the scripts from running 
# scripts that many be in any package about to be installed, when npm installs the packages ( this is a security measure )

COPY --from=builder /app/dist ./
# This is where we copy the dist folder built in the previous step ( builder )
# As the dist folder is present in the /app folder , we copy it from there to the current image's file system

EXPOSE 3000
# This is just used to inform which port we choose to expose when running this image

CMD ["node","src/server.js"]