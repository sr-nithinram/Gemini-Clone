const typingForm = document.querySelector('.typing-form');
const chatList = document.querySelector('.chat-list');
const suggestation = document.querySelectorAll('.suggestation-list .suggestation');
const toggleThemeButton = document.querySelector('#toggle-theme-button');
const deleteChatButton = document.querySelector('#delete-chat-button');


let userMessage = null;
let isResponseGenerating = false;


// API config :
const API_KEY = '';  // Add Your API Key here
const API_URL = ``;  // Add Your API URL Key here


const loadLocalstorageData = () => 
{
    const savedChat = localStorage.getItem('savedChat');
    const isLightMode = (localStorage.getItem('themeColor') === 'light_mode');

    // Apply the stored theme
    document.body.classList.toggle('light_mode',isLightMode);
    toggleThemeButton.innerHTML = isLightMode ? "dark_mode" : "light_mode";

    // Restore saved chats
    chatList.innerHTML = savedChat || '';

    document.body.classList.toggle('hide-header',savedChat);    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
}

loadLocalstorageData();
// create a new message element and return it

const  createMessageElement = (content, ...className) => 
{
    const div = document.createElement("div");
    div.classList.add("message",...className);
    div.innerHTML = content;
    return div;
}
// show typing effect by displaying words one by one 
const showTypingEffect = (text, textElement , incomingMessageDiv) => {
    const word = text.split(' ');
    let currentWordIndex = 0;
// Append each word to the text element with a space 
    const typingInterval = setInterval(() => {textElement.innerText += (currentWordIndex === 0 ? '' : ' ')+ word[currentWordIndex++];
    incomingMessageDiv.querySelector('.icon').classList.add("hide");
//  If all words are displayed 
      if (currentWordIndex === word.length) {
        clearInterval(typingInterval);
        isResponseGenerating = false; 
        incomingMessageDiv.querySelector('.icon').classList.remove("hide");
        localStorage.setItem('savedChat', chatList.innerHTML); // Save thats to local storage
    }
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom 
    }, 75);
}
// Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => 
{
    const textElement = incomingMessageDiv.querySelector(".text");   // get text element
    // Send a POST request to the API with the user's message
    try{
        const response = await fetch(API_URL,{
            method: 'POST',
            headers: { 'content-Type': 'application/json'},
            body: JSON.stringify({
                contents:[{
                    role: 'user',
                    parts: [{text:userMessage}]
                }]

            })            
        });

        const data =  await response.json();
        if(!response.ok) throw new Error(data.error.message);


        //  get the [API] response text and remove asterisks from it
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1'); // get the first candidate's response
        showTypingEffect(apiResponse, textElement , incomingMessageDiv);
    }
    catch(error)
    {
        isResponseGenerating = false; 
        console.log(error);
        textElement.innerText = error.message;
        textElement.classList.add('error');
    }finally
    {
        incomingMessageDiv.classList.remove('loading');
    }
}
// show loading animation while waiting for API response
const showLoadingAnimation = () =>{
    const html = `<div class="message-content">
                <img src="Assert/images/gemini.svg" alt="Gemini Image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, 'incoming','loading');
    chatList.appendChild(incomingMessageDiv); 
    
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
    generateAPIResponse(incomingMessageDiv);
}

// copy message text to the clipboard 
const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentNode.querySelector('.text').innerHTML;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = 'done'; //show tick icon 
    setTimeout(() =>  copyIcon.innerText = 'content_copy',1000); // Revert icon after 1 second 
}
//handle sending outgoing chat message
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector('.typing-input').value.trim() || userMessage;
    if (!userMessage || isResponseGenerating) return; // exit if there is no message

    isResponseGenerating =true;
    
    const html = `<div class="message-content">
                <img src="/Assert/images/user.jpg" alt="User Image" class="avatar">
                <p class="text"></p>
            </div>`;
    const outgoingMessageDiv = createMessageElement(html, 'outgoing');
    outgoingMessageDiv.querySelector('.text').innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    // animation
    typingForm.reset(); // Clear input field
    chatList.scrollTo(0, chatList.scrollHeight); // Scroll to the bottom
    document.body.classList.add('hide-header');  // Hide the header once chat start
    setTimeout(showLoadingAnimation,500); // show loading animation after a delay
}

// Set usermessage and handle outgoing chat when a suggestation is clicked
suggestation.forEach(suggestations => 
{
    suggestations.addEventListener('click',() => {
        userMessage = suggestations.querySelector('.text').innerText;
        handleOutgoingChat();
    });
}); 
// Toggle between light and dark themes
toggleThemeButton.addEventListener('click', () =>{
    const isLightMode = document.body.classList.toggle('light_mode');
    localStorage.setItem('themeColor', isLightMode ? 'light_mode' : 'dark_mode'); 
    toggleThemeButton.innerHTML = isLightMode ? 'dark_mode' : 'light_mode';
});

deleteChatButton.addEventListener('click', () => {
    if (confirm("Are you Sure, You want to delete all Messages?"))
    {
        localStorage.removeItem('savedChat');
        loadLocalstorageData();
    }
});

//  prevent default fromsubmission and handle outgoing chat
typingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    handleOutgoingChat();
});
