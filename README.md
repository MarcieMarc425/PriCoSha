# PriCoSha
Intro to Database Class Project

PriCoSha is a mock social network web application developed with NodeJS.

## Application Structure
- app
  - models
    - user.js
       User Model
  - routes.js
     All the routes for the application
- config 
  - database.js
     Hold database connection settings
  - passport.js
     Configure the strategies for passport
- views
  - landing.ejs
     Show homepage with login links
  - login.ejs
     Show login form
  - homepage.ejs
     After a user successfully logs in, he or she will see the homepage of the social media feed
- package.json
   Handle npm packages
- server.js
   Setup our application
