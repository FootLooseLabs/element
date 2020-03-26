Documentation of the current frontend framework in use in development → 


Quickstart <br/>

  <h4>Install Globally</h4>
  <code>
    1. npm run build
  </code>
  <code>
    2. sudo npm -g install .
  </code>

  <h4>Create a new Project</h4>
  <code>
    1. mkdir newProject && cd newProject
  </code>
  <code>
    2. muffin -i   //press enter for any prompt to take the default value 
  </code>


Project structure 

  
<table>
  <tr>
    <td>/ 
      assets/
    </td>
  </tr>
  <tr>
    <td>
        components/
    </td>
  </tr>
  <tr>
    <td>
        pages/
    </td>
  </tr>
  <tr>
    <td>
        gulpfile.js
    </td>
  </tr>
  <tr>
    <td>
        index.src.html
    </td>
  </tr>
  <tr>
    <td>
        package.json
    </td>
  </tr>
  <tr>
    <td>
        sw.js
    </td>
  </tr>
</table>


Javascript Interface

1. DomComponent

2. PostOffice

3. DataSource

4. Router

Prebuilt Tags

1. <include src="”></include>

2. <component-data src="”></component-data>

Prebuilt HTML Attributes 

1. route="<string>”

2. sub-route

CSS interface

1. .page class

## Examples -

### Case 1. Writing a simple component called ContactCard

<table>
  <tr>
    <td>components/contact_card.js</td>
    <td></td>
  </tr>
  <tr>
    <td>class ContactCard extends DomComponent {
    static domElName = "contact-card"   
    
    static schema = {
                                    “name”: “”, 
                                    “email”: “”, 
                                    “phone_no”: “”
                             }
    static markupFunc  = (data) => { 
                 return `<h1>${data.name}</h1>
                            <h3 class=”contact”>
                                  ${data. email} <br/> 
                                  ${data.phone_no}
                            </h3>`
    }

}

customElements.define(ContactCard.domElName, ContactCard)</td>
    <td>domElName specifies the html tagName

schema specifies the default data that will be used in markupFunc 

markupFunc specifies the function that renders the data into ui

the last line (customElements.define) registers the component for use in html/dom</td>
  </tr>
</table>




<table>
  <tr>
    <td>index.src.html</td>
    <td></td>
  </tr>
  <tr>
    <td><html>
   <head>
   </head>

<body>
    <div class="....”>
<contact-card>
     <component-data socket=”” label=””>
               {
                    "name”:”ankur”,                      
                    “email”:”ankur@footloose.io”, 
                    “phone_no”:”+919686800032”
               } 
      </component-data>
</contact-card>
    </div>
</body></td>
    <td>component-data tag can be added inside any component → 

socket specifies the PostOffice.websocket

label is any string to key this data in indexeddb 

any fixtures to quick test the component could be added as json inside component-data tag</td>
  </tr>
</table>


### Case 2. Adding multiple routes in SPA

<table>
  <tr>
    <td>index.src.html</td>
    <td></td>
  </tr>
  <tr>
    <td><html>
   <head>
   </head>

<body>
    <div route="contact-page””>
<contact-card>
     <component-data socket=”” label=””>
               {
                    "name”:”ankur”,                      
                    “email”:”ankur@footloose.io”, 
                    “phone_no”:”+919686800032”
               } 
      </component-data>
</contact-card>

<button onclick=”_router.go(‘about-page’)”>
     about
</button>
    </div>
 
     <div route=”about-page”>
         <h2>About Page</h2>
     </div>

     <script type=”text/javascript”>
         var _router = new Router();
         document.onload = (ev) => {
             _router.go(“contact-page”);
         }
    </script>
</body> </td>
    <td>route=”..string..” attribute specifies the unique route (url pathname & window.history entry)

_router variable (could be named anything) stores the Router instance

_router.go(“..route_name..”) function triggers the route with the given ..route_name..</td>
  </tr>
</table>


### Case 3. Splitting index.src.html into multiple files

<table>
  <tr>
    <td>index.src.html</td>
    <td></td>
  </tr>
  <tr>
    <td><html>
   <head>
   </head>

<body>
    <div route="contact-page””>
         <include src=”pages/contact.html”></include>
    </div>
 
     <div route=”about-page”>
          <include src=”pages/about.html”></include>
     </div>

     <script type=”text/javascript”>
         var _router = new Router();
         document.onload = (ev) => {
             _router.go("contact-page”);
         }
    </script>
</body> </td>
    <td><include src=”...”> tag loads the html template file at the path specified in its src attribute</td>
  </tr>
</table>


<table>
  <tr>
    <td>pages/contact.html</td>
    <td></td>
  </tr>
  <tr>
    <td><template>
            <style type="text/css”>
                   ._container_ { padding: 100px;}
            </style>
<div class=”_container_”>
<contact-card>
<component-data socket=”” label=””>
               {
                    "name”:”ankur”,                      
                    “email”:”ankur@footloose.io”, 
                    “phone_no”:”+919686800032”
               } 
 </component-data>
</contact-card>

<button onclick=”_router.go(‘about-page’)”>
     about
</button>
           </div>
</template></td>
    <td>any file included via <include src=”....”> has to be enclosed within the <template> tag; that can contain html, css & javascript.</td>
  </tr>
</table>


