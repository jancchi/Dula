/**
 * Dula Project - Main JS
 */

import { ENV } from './env.js';

const API_KEY = ENV.GOOGLE_API_KEY;
const CALENDAR_ID = ENV.GOOGLE_CALENDAR_ID;

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

    function setTextInputValue(value) {
        const input = document.getElementById('date_input');
        if (input) {
            input.value = value;
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.classList.add('ring-2', 'ring-rose-400');
            setTimeout(() => input.classList.remove('ring-2', 'ring-rose-400'), 1000);
        }
    }

    // ── Sprievod: výber mesiaca cez bubbles ───────────────
    function initMonthBubbles() {
        const bubbles = document.querySelectorAll('.month-bubble');
        if (!bubbles.length) return;

        bubbles.forEach(bubble => {
            if (bubble.classList.contains('off')) {
                bubble.setAttribute('aria-disabled', 'true');
                bubble.setAttribute('tabindex', '-1');
                return;
            }

            bubble.addEventListener('click', () => {
                bubbles.forEach(item => {
                    item.classList.remove('ring-2', 'ring-rose-400', 'bg-rose-50', 'border-rose-400');
                });

                bubble.classList.add('ring-2', 'ring-rose-400', 'bg-rose-50', 'border-rose-400');
                setTextInputValue(String(bubble.dataset.month || '').trim());
            });
        });
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
    function parseSlotDateTime(dateValue, timeValue) {
        if (!dateValue) return null;

        const dateObj = new Date(dateValue);
        if (Number.isNaN(dateObj.getTime())) return null;

        const [hoursRaw, minutesRaw] = String(timeValue || '00:00').split(':');
        const hours = Number.parseInt(hoursRaw, 10);
        const minutes = Number.parseInt(minutesRaw, 10);

        dateObj.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
        return dateObj;
    }

    function normalizeAirtableRecord(record) {
        const fields = record.fields || {};

        const dateValue = fields.Datum ?? fields.datum ?? fields.Date ?? fields.date;
        const timeValue = fields.Cas ?? fields.Čas ?? fields.cas ?? fields.time ?? fields.Time ?? '00:00';
        const capacityValue = Number(fields.Kapacita ?? fields.kapacita ?? fields.Capacity ?? fields.capacity ?? 0);
        const occupiedValue = Number(fields.Obsadene ?? fields['Obsadené'] ?? fields.obsadene ?? fields.occupied ?? 0);
        const slotDateTime = parseSlotDateTime(dateValue, timeValue);

        if (!slotDateTime) return null;

        return {
            id: record.id,
            dateValue,
            timeValue: String(timeValue),
            capacity: Number.isFinite(capacityValue) ? capacityValue : 0,
            occupied: Number.isFinite(occupiedValue) ? occupiedValue : 0,
            slotDateTime
        };
    }

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
            const res = await fetch('/.netlify/functions/airtable-slots');

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Netlify function error: ${res.status} ${res.statusText} | ${errorText}`);
            }

            const data = await res.json();
            const now = new Date();

            const futureRecords = (data.records || [])
                .map(normalizeAirtableRecord)
                .filter(record => record && record.slotDateTime >= now)
                .sort((a, b) => a.slotDateTime - b.slotDateTime);

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
            const errMsg = String(err?.message || '');
            const isAuthError = errMsg.includes('401') || errMsg.includes('AUTHENTICATION_REQUIRED');
            const isPermissionOrModelError = errMsg.includes('403') || errMsg.includes('INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND');
            const isMissingEnv = errMsg.includes('Missing environment variables');

            container.innerHTML = `
                <p class="text-center text-rose-400 py-12">
                    ${isMissingEnv
                        ? 'Na serveri chýbajú AIRTABLE premenné v Netlify Environment Variables.'
                        : isAuthError
                        ? 'Airtable overenie zlyhalo (401). Skontroluj AIRTABLE_TOKEN a jeho práva (scope data.records:read pre túto Base).'
                        : isPermissionOrModelError
                            ? 'Airtable vrátil 403. Skontroluj, že token má prístup k tejto Base a AIRTABLE_TABLE/AIRTABLE_TABLE_ID presne zodpovedá existujúcej tabuľke.'
                        : 'Termíny sa nepodarilo načítať. Skúste obnoviť stránku.'}
                </p>
            `;
            console.error('Airtable fetch error via Netlify function:', err);
        }
    }

    function renderSlotCards(records, container) {
        const dateFormatter = new Intl.DateTimeFormat('sk-SK', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        const cards = records.map(record => {
            const { timeValue, capacity, occupied, slotDateTime } = record;
            const isFull = occupied >= capacity;
            const remaining = capacity - occupied;

            const humanDate = dateFormatter.format(slotDateTime);
            const displayText = `${humanDate} o ${timeValue}`;

            if (isFull) {
                return `
                    <div class="flex flex-col gap-2 p-5 rounded-2xl border border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed">
                        <div class="flex items-center justify-between">
                            <span class="font-medium text-slate-400">${humanDate}</span>
                            <span class="text-sm bg-slate-200 text-slate-500 px-3 py-1 rounded-full">Obsadené</span>
                        </div>
                        <div class="flex items-center justify-between text-sm text-slate-400">
                            <span>🕐 ${timeValue}</span>
                            <span>0 z ${capacity} miest</span>
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
                        <span>🕐 ${timeValue}</span>
                        <span class="${remaining <= 2 ? 'text-amber-500 font-medium' : 'text-slate-400'}">
                            ${remaining} z ${capacity} miest
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

    initMonthBubbles();

});
