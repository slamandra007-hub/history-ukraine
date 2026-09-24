const SUPABASE_URL = "https://wizrjnpygkyafehgrkpa.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_jCenlJ3nA0jgjAlqqpXSWQ_C0hCZPW4";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


let registerMode = false;


// ==========================
// AUTH
// ==========================

function toggleAuth() {

    registerMode = !registerMode;

    const title = document.getElementById("auth-title");
    const button = document.getElementById("auth-button");
    const switchButton = document.querySelector(".secondary");

    if (registerMode) {

        title.textContent = "Реєстрація";

        button.textContent = "Зареєструватися";

        switchButton.textContent =
            "Вже маєте акаунт? Увійти";

    } else {

        title.textContent = "Вхід";

        button.textContent = "Увійти";

        switchButton.textContent =
            "Немає акаунта? Зареєструватися";
    }
}


async function login() {

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const message =
        document.getElementById("auth-message");


    if (!email || !password) {

        message.textContent =
            "Заповни email і пароль.";

        return;
    }


    if (registerMode) {

        const { data, error } =
            await supabaseClient.auth.signUp({
                email,
                password
            });


        if (error) {

            message.textContent =
                error.message;

            return;
        }


        message.textContent =
            "Акаунт створено! Перевір пошту для підтвердження.";

    } else {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });


        if (error) {

            message.textContent =
                error.message;

            return;
        }

        showMain(data.user);
    }
}


// ==========================
// LOGOUT
// ==========================

async function logout() {

    await supabaseClient.auth.signOut();

    document
        .getElementById("main-section")
        .classList.add("hidden");

    document
        .getElementById("auth-section")
        .classList.remove("hidden");
}


// ==========================
// SHOW MAIN
// ==========================

function showMain(user) {

    document
        .getElementById("auth-section")
        .classList.add("hidden");

    document
        .getElementById("main-section")
        .classList.remove("hidden");

    document
        .getElementById("user-email")
        .textContent = user.email;

    loadDates();
}


// ==========================
// ADD DATE
// ==========================

async function addDateEvent() {

    const date =
        document.getElementById("date-input").value.trim();

    const event =
        document.getElementById("event-input").value.trim();


    if (!date || !event) {

        alert("Заповни дату і подію.");

        return;
    }


    const {
        data: { user }
    } = await supabaseClient.auth.getUser();


    const { error } =
        await supabaseClient
            .from("dates_events")
            .insert({

                user_id: user.id,
                date: date,
                event: event

            });


    if (error) {

        alert(error.message);

        return;
    }


    document.getElementById("date-input").value = "";
    document.getElementById("event-input").value = "";

    loadDates();
}


// ==========================
// LOAD DATES
// ==========================

async function loadDates() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();


    if (!user) return;


    const { data, error } =
        await supabaseClient
            .from("dates_events")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(error);

        return;
    }


    const list =
        document.getElementById("dates-list");


    list.innerHTML = "";


    if (!data.length) {

        list.innerHTML =
            "<p>Поки немає жодної дати.</p>";

        return;
    }


    data.forEach(item => {

        const card =
            document.createElement("div");

        card.className = "date-card";


        card.innerHTML = `

            <div>
                <strong>${escapeHtml(item.date)}</strong>
                <span>${escapeHtml(item.event)}</span>
            </div>

            <div class="card-buttons">

                <button
                    class="edit"
                    onclick="editDate('${item.id}', '${escapeHtml(item.date)}', '${escapeHtml(item.event)}')">
                    Редагувати
                </button>

                <button
                    class="delete"
                    onclick="deleteDate('${item.id}')">
                    Видалити
                </button>

            </div>

        `;


        list.appendChild(card);

    });
}


// ==========================
// EDIT
// ==========================

async function editDate(id, oldDate, oldEvent) {

    const newDate =
        prompt("Дата:", oldDate);

    if (newDate === null) return;


    const newEvent =
        prompt("Подія:", oldEvent);

    if (newEvent === null) return;


    const { error } =
        await supabaseClient
            .from("dates_events")
            .update({

                date: newDate,
                event: newEvent

            })
            .eq("id", id);


    if (error) {

        alert(error.message);

        return;
    }


    loadDates();
}


// ==========================
// DELETE
// ==========================

async function deleteDate(id) {

    if (!confirm("Видалити цю дату?")) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("dates_events")
            .delete()
            .eq("id", id);


    if (error) {

        alert(error.message);

        return;
    }


    loadDates();
}


// ==========================
// SECURITY
// ==========================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ==========================
// CHECK SESSION
// ==========================

async function checkSession() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();


    if (session) {

        showMain(session.user);

    }

}


checkSession();
// ==========================
// FLASHCARDS
// ==========================
// ==========================
// DATE FLASHCARDS
// ==========================

let flashcards = [];
let currentCard = 0;
let correctAnswers = 0;
let flashcardMode = "date";
let flashcardMixed = false;

async function startDateFlashcards(mode) {

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("Спочатку увійдіть в акаунт.");
        return;
    }

    const { data, error } = await supabaseClient
        .from("dates_events")
        .select("*")
        .eq("user_id", user.id);

    if (error) {
        alert(error.message);
        return;
    }

    if (!data || data.length < 2) {
        alert("Для флеш-карток потрібно щонайменше 2 дати та події.");
        return;
    }

    flashcards = shuffleArray([...data]);
    currentCard = 0;
    correctAnswers = 0;

    flashcardMixed = mode === "mixed";

    if (mode === "event-to-date") {
        flashcardMode = "event";
    } else {
        flashcardMode = "date";
    }

    document
        .getElementById("flashcard-area")
        .classList.remove("hidden");

    document.getElementById("correct-count").textContent = "0";
    document.getElementById("total-count").textContent = "0";

    showFlashcard();

    document
        .getElementById("flashcard-area")
        .scrollIntoView({ behavior: "smooth" });
}


function showFlashcard() {

    if (currentCard >= flashcards.length) {
        finishFlashcards();
        return;
    }

    if (flashcardMixed) {
        flashcardMode =
            Math.random() < 0.5 ? "date" : "event";
    }

    const card = flashcards[currentCard];

    const question =
        document.getElementById("flashcard-question");

    const type =
        document.getElementById("flashcard-type");

    const options =
        document.getElementById("flashcard-options");

    const result =
        document.getElementById("flashcard-result");

    result.textContent = "";

    document
        .getElementById("next-card")
        .classList.add("hidden");

    options.innerHTML = "";

    if (flashcardMode === "date") {

        type.textContent =
            "Яка подія відповідає цій даті?";

        question.textContent = card.date;

        createDateOptions(card, "event");

    } else {

        type.textContent =
            "Яка дата відповідає цій події?";

        question.textContent = card.event;

        createDateOptions(card, "date");
    }

    document.getElementById("total-count").textContent =
        currentCard + 1;
}


function createDateOptions(correctCard, answerType) {

    const container =
        document.getElementById("flashcard-options");

    let options = [correctCard];

    const otherCards = shuffleArray(
        flashcards.filter(
            item => item.id !== correctCard.id
        )
    );

    options.push(...otherCards.slice(0, 3));

    options = shuffleArray(options);

    options.forEach(item => {

        const button =
            document.createElement("button");

        button.className = "answer-button";

        button.textContent = item[answerType];

        button.onclick = () => {

            checkDateAnswer(
                item.id === correctCard.id,
                button
            );

        };

        container.appendChild(button);
    });
}


function checkDateAnswer(isCorrect, clickedButton) {

    const result =
        document.getElementById("flashcard-result");

    const buttons =
        document.querySelectorAll(".answer-button");

    buttons.forEach(button => {
        button.disabled = true;
    });

    if (isCorrect) {

        correctAnswers++;

        result.textContent = "✓ Правильно!";

        clickedButton.classList.add("correct");

    } else {

        result.textContent = "✗ Неправильно.";

        clickedButton.classList.add("wrong");
    }

    document.getElementById("correct-count").textContent =
        correctAnswers;

    document
        .getElementById("next-card")
        .classList.remove("hidden");
}


function nextFlashcard() {

    currentCard++;

    showFlashcard();
}


function finishFlashcards() {

    document.getElementById("flashcard-type").textContent =
        "🎉 Тест завершено";

    document.getElementById("flashcard-question").textContent =
        `Твій результат: ${correctAnswers} / ${flashcards.length}`;

    document.getElementById("flashcard-options").innerHTML = "";

    document.getElementById("flashcard-result").textContent = "";

    document
        .getElementById("next-card")
        .classList.add("hidden");
}


function shuffleArray(array) {

    return array.sort(() => Math.random() - 0.5);

}
// ==========================
// PORTRAITS
// ==========================

async function addPortrait() {

    const name =
        document.getElementById("portrait-name")
            .value.trim();

    const description =
        document.getElementById("portrait-description")
            .value.trim();

    const file =
        document.getElementById("portrait-file")
            .files[0];


    if (!name || !file) {

        alert("Вкажи ім'я та вибери портрет.");

        return;
    }


    const {
        data: { user }
    } = await supabaseClient.auth.getUser();


    if (!user) return;


    // Унікальне ім'я файлу
const fileExtension = file.name.split(".").pop().toLowerCase();

const fileName =
    `${user.id}/${Date.now()}.${fileExtension}`;


    // Завантаження в Storage
    const { error: uploadError } =
        await supabaseClient
            .storage
            .from("portraits")
            .upload(fileName, file);


    if (uploadError) {

        alert(uploadError.message);

        return;
    }


    // Отримуємо URL
    const { data: urlData } =
        supabaseClient
            .storage
            .from("portraits")
            .getPublicUrl(fileName);


    const imageUrl =
        urlData.publicUrl;


    // Запис у таблицю
    const { error: databaseError } =
        await supabaseClient
            .from("portraits")
            .insert({

                user_id: user.id,
                name: name,
                description: description,
                image_url: imageUrl

            });


    if (databaseError) {

        alert(databaseError.message);

        return;
    }


    // Очищення
    document.getElementById("portrait-name").value = "";

    document.getElementById("portrait-description").value = "";

    document.getElementById("portrait-file").value = "";


    loadPortraits();
}
async function loadPortraits() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) return;

    const { data, error } = await supabaseClient
        .from("portraits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    const list = document.getElementById("portraits-list");
    list.innerHTML = "";

    if (!data.length) {
        list.innerHTML = "<p>Поки немає портретів.</p>";
        return;
    }

    data.forEach(portrait => {
        const card = document.createElement("div");
        card.className = "portrait-card";

        card.innerHTML = `
            <img src="${portrait.image_url}" alt="${escapeHtml(portrait.name)}">

            <div class="portrait-info">
                <h3>${escapeHtml(portrait.name)}</h3>
                <p>${escapeHtml(portrait.description || "")}</p>

                <div class="portrait-actions">
                    <button class="edit-portrait-btn">✏️ Редагувати</button>
                    <button class="delete-portrait-btn">🗑️ Видалити</button>
                </div>
            </div>
        `;

        card.querySelector(".edit-portrait-btn").addEventListener("click", () => {
            editPortrait(portrait.id);
        });

        card.querySelector(".delete-portrait-btn").addEventListener("click", () => {
            deletePortrait(portrait.id);
        });

        list.appendChild(card);
    });
}
async function editPortrait(id) {
    const { data: portrait, error } = await supabaseClient
        .from("portraits")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    const newName = prompt("Нове ім'я:", portrait.name);

    if (newName === null) return;

    const newDescription = prompt(
        "Новий опис:",
        portrait.description || ""
    );

    if (newDescription === null) return;

    if (!newName.trim()) {
        alert("Ім'я не може бути порожнім.");
        return;
    }

    const { error: updateError } = await supabaseClient
        .from("portraits")
        .update({
            name: newName.trim(),
            description: newDescription.trim()
        })
        .eq("id", id);

    if (updateError) {
        alert(updateError.message);
        return;
    }

    await loadPortraits();
}


async function deletePortrait(id) {
    if (!confirm("Видалити цей портрет?")) return;

    const { error } = await supabaseClient
        .from("portraits")
        .delete()
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    await loadPortraits();
}
// ==========================
// PORTRAIT FLASHCARDS
// ==========================

let portraitFlashcards = [];
let currentPortraitCard = 0;
let correctPortraitAnswers = 0;
let portraitFlashcardMode = "image";


// Початок флеш-карток
async function startPortraitFlashcards(mode) {

    portraitFlashcardMode = mode;

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;


    const { data, error } =
        await supabaseClient
            .from("portraits")
            .select("*")
            .eq("user_id", user.id);


    if (error) {

        alert(error.message);
        return;

    }


    if (!data || data.length < 2) {

        alert(
            "Для флеш-карток потрібно щонайменше 2 портрети."
        );

        return;

    }


    portraitFlashcards =
        shuffleArray([...data]);

    currentPortraitCard = 0;
    correctPortraitAnswers = 0;


    document
        .getElementById("portrait-flashcard-area")
        .classList.remove("hidden");


    document
        .getElementById("portrait-correct-count")
        .textContent = 0;


    document
        .getElementById("portrait-total-count")
        .textContent = 0;


    showPortraitFlashcard();


    document
        .getElementById("portrait-flashcard-area")
        .scrollIntoView({
            behavior: "smooth"
        });
}


// Показати картку
function showPortraitFlashcard() {

    if (
        currentPortraitCard >=
        portraitFlashcards.length
    ) {

        finishPortraitFlashcards();

        return;

    }


    const card =
        portraitFlashcards[currentPortraitCard];


    const type =
        document.getElementById(
            "portrait-flashcard-type"
        );

    const question =
        document.getElementById(
            "portrait-flashcard-question"
        );

    const options =
        document.getElementById(
            "portrait-flashcard-options"
        );

    const result =
        document.getElementById(
            "portrait-flashcard-result"
        );


    options.innerHTML = "";
    result.textContent = "";


    document
        .getElementById("next-portrait-card")
        .classList.add("hidden");


    if (portraitFlashcardMode === "image") {

        type.textContent =
            "Хто зображений на портреті?";


        question.innerHTML = `
            <img
                src="${escapeHtml(card.image_url)}"
                class="portrait-flashcard-image"
                alt="Історичний портрет"
            >
        `;


        createPortraitOptions(
            card,
            "name"
        );

    } else {

        type.textContent =
            "Який портрет відповідає цій особі?";


        question.innerHTML = `
            <div class="portrait-flashcard-name">
                ${escapeHtml(card.name)}
            </div>
        `;


        createPortraitOptions(
            card,
            "image"
        );

    }


    document
        .getElementById(
            "portrait-total-count"
        )
        .textContent =
            currentPortraitCard + 1;
}


// Створення відповідей
function createPortraitOptions(
    correctCard,
    answerType
) {

    const container =
        document.getElementById(
            "portrait-flashcard-options"
        );


    let options = [correctCard];


    const otherCards =
        shuffleArray(
            portraitFlashcards.filter(
                item =>
                    item.id !== correctCard.id
            )
        );


    options.push(
        ...otherCards.slice(0, 3)
    );


    options =
        shuffleArray(options);


    options.forEach(item => {

        const button =
            document.createElement("button");


        button.className =
            "portrait-answer-button";


        if (answerType === "name") {

            button.textContent =
                item.name;

        } else {

            button.innerHTML = `
                <img
                    src="${escapeHtml(item.image_url)}"
                    alt="Портрет"
                >
            `;

        }


        button.onclick = () => {

            checkPortraitAnswer(
                item.id === correctCard.id,
                button
            );

        };


        container.appendChild(button);

    });

}


// Перевірка відповіді
function checkPortraitAnswer(
    isCorrect,
    clickedButton
) {

    const result =
        document.getElementById(
            "portrait-flashcard-result"
        );


    const buttons =
        document.querySelectorAll(
            ".portrait-answer-button"
        );


    buttons.forEach(button => {
        button.disabled = true;
    });


    if (isCorrect) {

        correctPortraitAnswers++;


        result.textContent =
            "✓ Правильно!";


        clickedButton.classList.add(
            "correct"
        );

    } else {

        result.textContent =
            "✗ Неправильно.";


        clickedButton.classList.add(
            "wrong"
        );

    }


    document
        .getElementById(
            "portrait-correct-count"
        )
        .textContent =
            correctPortraitAnswers;


    document
        .getElementById(
            "next-portrait-card"
        )
        .classList.remove("hidden");

}


// Наступна картка
function nextPortraitFlashcard() {

    currentPortraitCard++;

    showPortraitFlashcard();

}


// Завершення
function finishPortraitFlashcards() {

    const type =
        document.getElementById(
            "portrait-flashcard-type"
        );

    const question =
        document.getElementById(
            "portrait-flashcard-question"
        );

    const options =
        document.getElementById(
            "portrait-flashcard-options"
        );

    const result =
        document.getElementById(
            "portrait-flashcard-result"
        );


    type.textContent =
        "🎉 Тест завершено";


    question.innerHTML = `
        <div class="portrait-flashcard-name">
            Результат:
            ${correctPortraitAnswers}
            /
            ${portraitFlashcards.length}
        </div>
    `;


    options.innerHTML = "";
    result.textContent = "";


    document
        .getElementById(
            "next-portrait-card"
        )
        .classList.add("hidden");

}
// ==========================
// BOOKS
// ==========================

async function addBook() {
    const title = document.getElementById("book-title").value.trim();
    const file = document.getElementById("book-file").files[0];

    if (!title || !file) {
        alert("Вкажи назву книги та вибери PDF-файл.");
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("Потрібно увійти в акаунт.");
        return;
    }

    if (file.type !== "application/pdf") {
        alert("Можна завантажувати тільки PDF-файли.");
        return;
    }

    const fileName = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabaseClient
        .storage
        .from("books")
        .upload(fileName, file);

    if (uploadError) {
        alert("Помилка завантаження: " + uploadError.message);
        return;
    }

    const { data: urlData } = supabaseClient
        .storage
        .from("books")
        .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    const { error: databaseError } = await supabaseClient
        .from("books")
        .insert({
            user_id: user.id,
            title: title,
            file_url: fileUrl
        });

    if (databaseError) {
        alert("Помилка бази даних: " + databaseError.message);
        return;
    }

    document.getElementById("book-title").value = "";
    document.getElementById("book-file").value = "";

    alert("Книгу успішно додано!");

    loadBooks();
}
async function loadBooks() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) return;

    const { data, error } = await supabaseClient
        .from("books")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        alert("Помилка завантаження книг: " + error.message);
        return;
    }

    const list = document.getElementById("books-list");
    list.innerHTML = "";

    if (!data || data.length === 0) {
        list.innerHTML = "<p>Поки немає жодної книги.</p>";
        return;
    }

    data.forEach(book => {
        const card = document.createElement("div");

        card.className = "book-card";

        card.innerHTML = `
            <div class="book-info">
                <h3>${escapeHtml(book.title)}</h3>

                <a href="${escapeHtml(book.file_url)}"
                   target="_blank"
                   rel="noopener">
                    📖 Відкрити PDF
                </a>
            </div>

            <button class="delete-book-btn">
                🗑️ Видалити
            </button>
        `;

        card.querySelector(".delete-book-btn")
            .addEventListener("click", () => {
                deleteBook(book.id);
            });

        list.appendChild(card);
    });
}
async function deleteBook(id) {
    if (!confirm("Видалити цю книгу?")) return;

    const { data: book, error: getError } = await supabaseClient
        .from("books")
        .select("file_url")
        .eq("id", id)
        .single();

    if (getError) {
        alert("Помилка отримання книги: " + getError.message);
        return;
    }

    const fileUrl = book.file_url;
    const marker = "/storage/v1/object/public/books/";

    if (fileUrl.includes(marker)) {
        const filePath = decodeURIComponent(
            fileUrl.split(marker)[1]
        );

        const { error: storageError } = await supabaseClient
            .storage
            .from("books")
            .remove([filePath]);

        if (storageError) {
            alert("Помилка видалення PDF: " + storageError.message);
            return;
        }
    }

    const { error: databaseError } = await supabaseClient
        .from("books")
        .delete()
        .eq("id", id);

    if (databaseError) {
        alert("Помилка видалення книги: " + databaseError.message);
        return;
    }

    loadBooks();
}
// ==========================
// SECTION SWITCHING
// ==========================

function showSection(sectionId) {

    document.getElementById("dates-section")
        .classList.add("hidden");

    document.getElementById("portraits-section")
        .classList.add("hidden");

    document.getElementById("books-section")
        .classList.add("hidden");

    document.getElementById(sectionId)
        .classList.remove("hidden");

    if (sectionId === "portraits-section") {
        loadPortraits();
    }

    if (sectionId === "books-section") {
        loadBooks();
    }
}
