/**
 * Dula Project - Main JS
 */

const API_KEY = "AIzaSyBdyFGCnt4I_NcxIhHU7wjAFRN8LrmoOn8";
const CALENDAR_ID = "90602a0b6bda9b6f7c3b5a00b58cd39c8cfd488e629167149f8547483137ae7f@group.calendar.google.com";

// ── Airtable ──────────────────────────────────────────────
const AIRTABLE_TOKEN = "pat1234";   // ← nahraď svojím tokenom
const AIRTABLE_BASE  = "app1234";   // ← nahraď svojím Base ID
const AIRTABLE_TABLE = "Terminy";
// ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    // ── Scroll reveal ─────────────────────────────────────
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // ── Netlify form submit ───────────────────────────────
    const bookingForm = document.querySelector('form[data-netlify="true"]');

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(bookingForm);
            const submitBtn = bookingForm.querySelector('button');
            const originalBtnText = submitBtn.innerText;

            submitBtn.innerText = "Odosielam...";
            submitBtn.disabled = true;

            try {
                const response = await fetch("/", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams(formData).toString(),
                });

                if (response.ok) {
                    bookingForm.innerHTML = `
                        <div class="text-center py-8 space-y-4">
                            <div class="text-5xl">🌸</div>
                            <h3 class="text-2xl text-rose-800 font-serif">Ďakujem!</h3>
                            <p class="text-slate-600">Vaša rezervácia bola odoslaná. Dula sa vám čoskoro ozve.</p>
                        </div>
                    `;
                } else {
                    throw new Error("Chyba pri odosielaní");
                }
            } catch (error) {
                alert("Ups, niečo sa nepodarilo. Skúste to prosím neskôr alebo napíšte email. error: " + error);
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // ── Pomocná funkcia: zápis času do formulára ──────────
    function setDateInput(date) {
        const options = {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        };
        const formattedDate = new Date(date).toLocaleString('sk-SK', options);
        const input = document.getElementById("date_input");
        if (input) {
            input.value = formattedDate;
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.classList.add('ring-2', 'ring-rose-400');
            setTimeout(() => input.classList.remove('ring-2', 'ring-rose-400'), 1000);
        }
    }

    // ── FullCalendar (individuálna) ───────────────────────
    const calendarEl = document.getElementById('calendar');
    let calendarInstance = null;

    function initCalendar() {
        if (calendarInstance || !calendarEl) return;

        calendarInstance = new FullCalendar.Calendar(calendarEl, {
            initialView: window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek',
            googleCalendarApiKey: API_KEY,
            selectOverlap: false,
            schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
            longPressDelay: 0,
            selectMinDistance: 5,

            events: {
                googleCalendarId: CALENDAR_ID,
                display: 'background',
                color: '#ff9f89'
            },

            locale: "sk",
            firstDay: 1,
            validRange: { start: new Date() },

            slotLabelFormat: { hour: 'numeric', minute: '2-digit', hour12: false },
            eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },

            slotMinTime: '8:00:00',
            slotMaxTime: '21:00:00',
            slotDuration: '00:30:00',

            selectable: true,
            allDaySlot: false,

            eventDataTransform: (eventData) => ({
                ...eventData,
                overlap: false,
                display: 'background'
            }),

            slotLabelContent: (arg) => ({
                html: `<div class="text-xl font-light text-rose-300">${arg.text}</div>`
            }),

            select: (info) => setDateInput(info.start),

            dateClick: (info) => {
                if (window.innerWidth < 768) setDateInput(info.date);
            }
        });

        calendarInstance.render();
    }

    // ── Airtable: načítanie skupinových termínov ──────────
    async function fetchGroupSlots() {
        const container = document.getElementById('skupinove-sloty');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center py-12 text-rose-300">
                <svg class="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <span class="text-slate-400">Načítavam termíny...</span>
            </div>
        `;

        try {
            const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}` +
                        `?sort[0][field]=Datum&sort[0][direction]=asc`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
            });

            if (!res.ok) throw new Error(`Airtable API error: ${res.status}`);

            const data = await res.json();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Filtrovať len budúce termíny
            const futureRecords = data.records.filter(r => {
                const d = new Date(r.fields.Datum);
                return d >= today;
            });

            if (futureRecords.length === 0) {
                container.innerHTML = `
                    <p class="text-center text-slate-400 py-12">
                        Momentálne nie sú vypísané žiadne skupinové termíny.<br>
                        <span class="text-sm">Skúste to neskôr alebo nás kontaktujte.</span>
                    </p>
                `;
                return;
            }

            renderSlotCards(futureRecords, container);

        } catch (err) {
            container.innerHTML = `
                <p class="text-center text-rose-400 py-12">
                    Termíny sa nepodarilo načítať. Skúste obnoviť stránku.
                </p>
            `;
            console.error("Airtable fetch error:", err);
        }
    }

    function renderSlotCards(records, container) {
        const dateFormatter = new Intl.DateTimeFormat('sk-SK', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        const cards = records.map(record => {
            const { Datum, Cas, Kapacita, Obsadene } = record.fields;
            const isFull = (Obsadene ?? 0) >= (Kapacita ?? 0);
            const remaining = (Kapacita ?? 0) - (Obsadene ?? 0);

            const dateObj = new Date(Datum);
            const humanDate = dateFormatter.format(dateObj);
            const displayText = `${humanDate} o ${Cas}`;

            if (isFull) {
                return `
                    <div class="flex flex-col gap-2 p-5 rounded-2xl border border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed">
                        <div class="flex items-center justify-between">
                            <span class="font-medium text-slate-400">${humanDate}</span>
                            <span class="text-sm bg-slate-200 text-slate-500 px-3 py-1 rounded-full">Obsadené</span>
                        </div>
                        <div class="flex items-center justify-between text-sm text-slate-400">
                            <span>🕐 ${Cas}</span>
                            <span>0 z ${Kapacita} miest</span>
                        </div>
                    </div>
                `;
            }

            return `
                <button
                    type="button"
                    data-display="${displayText}"
                    class="slot-card text-left flex flex-col gap-2 p-5 rounded-2xl border border-rose-200
                           bg-white hover:bg-rose-50 hover:border-rose-400 hover:shadow-md
                           transition-all duration-200 cursor-pointer group"
                >
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-rose-900 group-hover:text-rose-700">${humanDate}</span>
                        <span class="text-sm bg-rose-100 text-rose-600 px-3 py-1 rounded-full">Voľné</span>
                    </div>
                    <div class="flex items-center justify-between text-sm text-slate-500">
                        <span>🕐 ${Cas}</span>
                        <span class="${remaining <= 2 ? 'text-amber-500 font-medium' : 'text-slate-400'}">
                            ${remaining} z ${Kapacita} miest
                        </span>
                    </div>
                </button>
            `;
        }).join('');

        container.innerHTML = `<div class="grid sm:grid-cols-2 gap-4">${cards}</div>`;

        // Klik na slot → zápis do formulára
        container.querySelectorAll('.slot-card').forEach(card => {
            card.addEventListener('click', () => {
                // Zruš highlight ostatných
                container.querySelectorAll('.slot-card').forEach(c => {
                    c.classList.remove('ring-2', 'ring-rose-400', 'bg-rose-50', 'border-rose-400');
                });

                // Zvýrazni vybraný
                card.classList.add('ring-2', 'ring-rose-400', 'bg-rose-50', 'border-rose-400');

                // Zapis do input
                const input = document.getElementById("date_input");
                if (input) {
                    input.value = card.dataset.display;
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    input.classList.add('ring-2', 'ring-rose-400');
                    setTimeout(() => input.classList.remove('ring-2', 'ring-rose-400'), 1000);
                }
            });
        });
    }

    // ── Radio toggle: skupinová ↔ individuálna ────────────
    const calendarWrapper   = document.getElementById('calendar-wrapper');
    const slotsWrapper      = document.getElementById('slots-wrapper');
    const radioButtons      = document.querySelectorAll('input[name="type"]');

    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'individualna') {
                slotsWrapper?.classList.add('hidden');
                calendarWrapper?.classList.remove('hidden');
                initCalendar(); // lazy init — calendar sa renderuje až keď je viditeľný
            } else if (radio.value === 'skupinova') {
                calendarWrapper?.classList.add('hidden');
                slotsWrapper?.classList.remove('hidden');
                fetchGroupSlots();
            }
        });
    });

});