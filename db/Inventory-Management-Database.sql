--
-- PostgreSQL database dump
--

\restrict draUl5ekZBknTsYPsrwE3QLXllKwAUP8eK2gYSmVTdeUiSqtUqM4kmufFqTdunI

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

-- Started on 2026-03-11 18:11:18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 26527)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5197 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 26516)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5198 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 916 (class 1247 OID 26582)
-- Name: borrow_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.borrow_status AS ENUM (
    'active',
    'returned',
    'overdue'
);


ALTER TYPE public.borrow_status OWNER TO postgres;

--
-- TOC entry 913 (class 1247 OID 26572)
-- Name: item_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.item_status AS ENUM (
    'in_store',
    'borrowed',
    'damaged',
    'missing'
);


ALTER TYPE public.item_status OWNER TO postgres;

--
-- TOC entry 910 (class 1247 OID 26566)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'staff'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 277 (class 1255 OID 26811)
-- Name: fn_update_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_update_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 229 (class 1259 OID 26785)
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    model_type character varying(100) NOT NULL,
    model_id uuid NOT NULL,
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- TOC entry 5199 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE activity_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.activity_logs IS 'Immutable audit trail. Write-once. Never update or delete.';


--
-- TOC entry 5200 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN activity_logs.action; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.activity_logs.action IS 'item_created | item_updated | item_deleted | quantity_changed | status_changed | borrowed | returned | user_created';


--
-- TOC entry 5201 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN activity_logs.model_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.activity_logs.model_type IS 'Model affected: Item | Borrowing | User | Place | Cupboard';


--
-- TOC entry 5202 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN activity_logs.old_values; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.activity_logs.old_values IS 'JSONB: field values BEFORE the change.';


--
-- TOC entry 5203 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN activity_logs.new_values; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.activity_logs.new_values IS 'JSONB: field values AFTER the change.';


--
-- TOC entry 228 (class 1259 OID 26740)
-- Name: borrowings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.borrowings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    item_id uuid NOT NULL,
    borrower_name character varying(255) NOT NULL,
    borrower_contact character varying(255) NOT NULL,
    borrow_date date DEFAULT CURRENT_DATE NOT NULL,
    expected_return_date date NOT NULL,
    actual_return_date date,
    quantity_borrowed integer NOT NULL,
    status public.borrow_status DEFAULT 'active'::public.borrow_status NOT NULL,
    processed_by uuid NOT NULL,
    returned_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT borrowings_quantity_borrowed_check CHECK ((quantity_borrowed > 0)),
    CONSTRAINT chk_actual_return_date CHECK ((((status = 'returned'::public.borrow_status) AND (actual_return_date IS NOT NULL)) OR (status <> 'returned'::public.borrow_status)))
);


ALTER TABLE public.borrowings OWNER TO postgres;

--
-- TOC entry 5204 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE borrowings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.borrowings IS 'Records of items borrowed by third parties.';


--
-- TOC entry 5205 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN borrowings.quantity_borrowed; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.borrowings.quantity_borrowed IS 'Qty taken at time of borrow. Never changes after creation.';


--
-- TOC entry 5206 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN borrowings.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.borrowings.status IS 'active=out | returned=back | overdue=past expected date';


--
-- TOC entry 5207 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN borrowings.processed_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.borrowings.processed_by IS 'Staff who recorded the borrow.';


--
-- TOC entry 5208 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN borrowings.returned_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.borrowings.returned_by IS 'Staff who processed the return. NULL while still borrowed.';


--
-- TOC entry 225 (class 1259 OID 26650)
-- Name: cupboards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cupboards (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.cupboards OWNER TO postgres;

--
-- TOC entry 5209 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE cupboards; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cupboards IS 'Physical storage cupboards / cabinets in the organization.';


--
-- TOC entry 5210 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN cupboards.created_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cupboards.created_by IS 'Admin user who created this cupboard record.';


--
-- TOC entry 227 (class 1259 OID 26701)
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(100) NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    serial_number character varying(255),
    image_path character varying(500),
    description text,
    place_id uuid NOT NULL,
    status public.item_status DEFAULT 'in_store'::public.item_status NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    CONSTRAINT items_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE public.items OWNER TO postgres;

--
-- TOC entry 5211 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE items; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.items IS 'Inventory items (tools, components, equipment).';


--
-- TOC entry 5212 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN items.code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.items.code IS 'Unique item code. Both DB and app enforce uniqueness.';


--
-- TOC entry 5213 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN items.quantity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.items.quantity IS 'Current available stock. CHECK prevents negatives.';


--
-- TOC entry 5214 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN items.image_path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.items.image_path IS 'Relative path: storage/items/filename.jpg';


--
-- TOC entry 5215 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN items.place_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.items.place_id IS 'Which place (shelf/drawer) this item is stored in.';


--
-- TOC entry 5216 (class 0 OID 0)
-- Dependencies: 227
-- Name: COLUMN items.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.items.status IS 'in_store=available | borrowed=all qty out | damaged | missing';


--
-- TOC entry 224 (class 1259 OID 26630)
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.personal_access_tokens OWNER TO postgres;

--
-- TOC entry 5217 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE personal_access_tokens; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.personal_access_tokens IS 'Laravel Sanctum API tokens.';


--
-- TOC entry 5218 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN personal_access_tokens.token; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.personal_access_tokens.token IS 'SHA-256 hash of the token. Plain token returned once on creation only.';


--
-- TOC entry 223 (class 1259 OID 26629)
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.personal_access_tokens_id_seq OWNER TO postgres;

--
-- TOC entry 5219 (class 0 OID 0)
-- Dependencies: 223
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- TOC entry 226 (class 1259 OID 26672)
-- Name: places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.places (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cupboard_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.places OWNER TO postgres;

--
-- TOC entry 5220 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE places; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.places IS 'Sub-locations inside a cupboard (shelf, drawer, rack unit).';


--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN places.cupboard_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.places.cupboard_id IS 'Parent cupboard this place belongs to.';


--
-- TOC entry 222 (class 1259 OID 26612)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id uuid,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE sessions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.sessions IS 'Laravel session storage. Required when SESSION_DRIVER=database.';


--
-- TOC entry 221 (class 1259 OID 26589)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public.user_role DEFAULT 'staff'::public.user_role NOT NULL,
    email_verified_at timestamp without time zone,
    remember_token character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'System users. Created by admin only — no self registration.';


--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN users.password; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.password IS 'Bcrypt hashed. Laravel handles hashing automatically.';


--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN users.role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.role IS 'admin = full access | staff = limited access';


--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN users.deleted_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.deleted_at IS 'NULL = active. Non-null = soft deleted (data preserved).';


--
-- TOC entry 4947 (class 2604 OID 26633)
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- TOC entry 5191 (class 0 OID 26785)
-- Dependencies: 229
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, action, model_type, model_id, old_values, new_values, ip_address, created_at) FROM stdin;
d5d02d3b-3ec1-4f16-bf5b-89f60a2a917f	984cd457-8177-4b3d-950f-f51e8244c768	item_created	Item	1c0ef40e-c4e0-458e-b691-2aa16eb235fb	\N	{"name": "Arduino Uno R3", "status": "in_store", "quantity": 8}	127.0.0.1	2026-03-01 17:43:15.082184
4229fc62-0892-48e2-9e35-98d2f267eada	984cd457-8177-4b3d-950f-f51e8244c768	borrowed	Item	1c0ef40e-c4e0-458e-b691-2aa16eb235fb	{"status": "in_store", "quantity": 8}	{"borrower": "Ruwan Jayawardena", "quantity": 6}	127.0.0.1	2026-03-06 17:43:15.082184
4eaad821-d353-4d14-a4b1-b5be71ce6304	984cd457-8177-4b3d-950f-f51e8244c768	status_changed	Item	a122508e-62f1-4212-967e-044c6b873666	{"status": "in_store"}	{"status": "damaged"}	127.0.0.1	2026-03-09 17:43:15.082184
\.


--
-- TOC entry 5190 (class 0 OID 26740)
-- Dependencies: 228
-- Data for Name: borrowings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.borrowings (id, item_id, borrower_name, borrower_contact, borrow_date, expected_return_date, actual_return_date, quantity_borrowed, status, processed_by, returned_by, created_at, updated_at) FROM stdin;
ce693595-a254-4b97-a442-acaf5c8982be	1c0ef40e-c4e0-458e-b691-2aa16eb235fb	Ruwan Jayawardena	071-2345678	2026-03-06	2026-03-20	\N	2	active	984cd457-8177-4b3d-950f-f51e8244c768	\N	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184
f0d1d98c-7983-41a1-87f3-887f57a5b8ce	5c7b6c32-3323-461b-a722-36ac29e73d10	Chamara Bandara	077-9876543	2026-02-25	2026-03-04	2026-03-03	3	returned	984cd457-8177-4b3d-950f-f51e8244c768	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184
78ac5c8c-33c1-428c-b585-379b281e0dcc	3e9b13d2-3d8c-429c-964a-3dac23ce4513	Sanduni Fernando	076-1112222	2026-02-19	2026-03-05	\N	1	overdue	984cd457-8177-4b3d-950f-f51e8244c768	\N	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184
\.


--
-- TOC entry 5187 (class 0 OID 26650)
-- Dependencies: 225
-- Data for Name: cupboards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cupboards (id, name, description, created_by, created_at, updated_at, deleted_at) FROM stdin;
a0000001-0000-4000-8000-000000000001	Cabinet A — Electronics	Main electronics and microcontroller storage	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
a0000001-0000-4000-8000-000000000002	Cabinet B — Tools	Hand tools, soldering equipment and meters	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
a0000001-0000-4000-8000-000000000003	Cabinet C — Networking	Networking equipment, cables and modules	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
\.


--
-- TOC entry 5189 (class 0 OID 26701)
-- Dependencies: 227
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, name, code, quantity, serial_number, image_path, description, place_id, status, created_by, created_at, updated_at, deleted_at) FROM stdin;
1c0ef40e-c4e0-458e-b691-2aa16eb235fb	Arduino Uno R3	EL-001	8	\N	\N	ATmega328P microcontroller development board	b0000001-0000-4000-8000-000000000001	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
5c7b6c32-3323-461b-a722-36ac29e73d10	ESP32 Dev Board	EL-002	12	\N	\N	Dual-core Wi-Fi and Bluetooth microcontroller	b0000001-0000-4000-8000-000000000001	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
82ae6002-35b5-48f5-91ea-2e4a80853f41	ESP8266 NodeMCU	EL-003	6	\N	\N	Low-cost Wi-Fi microchip with TCP/IP stack	b0000001-0000-4000-8000-000000000001	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
50bf715e-f32b-4da6-981f-1e9812a8ee20	Arduino Mega 2560	EL-004	4	\N	\N	High performance Arduino with 54 digital I/O pins	b0000001-0000-4000-8000-000000000001	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
3e9b13d2-3d8c-429c-964a-3dac23ce4513	Raspberry Pi 4 Model B (4GB)	EL-010	3	RPI-2024-0042	\N	Quad-core ARM Cortex-A72, 4GB RAM single-board computer	b0000001-0000-4000-8000-000000000002	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
bfdfb830-b302-47e5-a264-b64b0d73eca3	Raspberry Pi Zero 2W	EL-011	5	\N	\N	Compact single-board computer with wireless LAN	b0000001-0000-4000-8000-000000000002	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
824ef436-f170-4206-843f-479cf5d3c164	DHT22 Temperature Sensor	SN-001	20	\N	\N	Digital temperature and humidity sensor module	b0000001-0000-4000-8000-000000000003	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
6195f977-d024-4b1d-b4e4-550dd12c8510	HC-SR04 Ultrasonic Sensor	SN-002	15	\N	\N	Ultrasonic distance measurement module (2cm-4m)	b0000001-0000-4000-8000-000000000003	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
d0154984-87a0-45c2-b70b-2df764edd970	PIR Motion Sensor	SN-003	10	\N	\N	Passive infrared motion detection module	b0000001-0000-4000-8000-000000000003	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
ee5b63de-a7c7-4458-ae6a-89d960221a25	Fluke 117 Digital Multimeter	TL-001	2	FLK-2023-0099	\N	True-RMS digital multimeter for electrical measurements	b0000001-0000-4000-8000-000000000004	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
a122508e-62f1-4212-967e-044c6b873666	Hantek DSO5072P Oscilloscope	TL-002	1	HNT-2022-0018	\N	70MHz 2-channel digital storage oscilloscope	b0000001-0000-4000-8000-000000000004	damaged	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
318bc5ea-682f-4b12-8f10-d2393cd66f16	Soldering Iron Station 60W	TL-003	3	\N	\N	Temperature controlled soldering station	b0000001-0000-4000-8000-000000000005	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
b33b2d70-ffd6-4e59-b621-7f1429e2c221	TP-Link TL-SG108 Switch	NT-001	2	TPL-2023-0055	\N	8-port Gigabit unmanaged desktop switch	b0000001-0000-4000-8000-000000000006	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
79557d0f-cdc9-406e-a030-91a77e02de9e	Cat6 Ethernet Cable 2m	NT-010	30	\N	\N	Cat6 UTP patch cable 2 metre length	b0000001-0000-4000-8000-000000000007	in_store	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
1d643942-1703-49a0-a969-abd2663167da	USB-C to USB-A Cable 1m	NT-011	0	\N	\N	USB 3.1 Gen1 data and charging cable	b0000001-0000-4000-8000-000000000007	missing	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
\.


--
-- TOC entry 5186 (class 0 OID 26630)
-- Dependencies: 224
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
4	App\\Models\\User	984cd457-8177-4b3d-950f-f51e8244c768	ims-token	ae10721f10eb40b773b298eaaefd54204491dc884947388499dcdf9796027ccb	["*"]	2026-03-11 12:15:10	\N	2026-03-11 09:11:27	2026-03-11 17:45:10.008767
2	App\\Models\\User	aa7bead2-7f38-4460-b125-b7a4e8d14014	ims-token	0d0495d8de80a828b247531521be2577627edbde4aa823ca1ace8342331b6594	["*"]	2026-03-10 10:31:50	\N	2026-03-10 10:29:31	2026-03-10 16:01:50.279289
\.


--
-- TOC entry 5188 (class 0 OID 26672)
-- Dependencies: 226
-- Data for Name: places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.places (id, cupboard_id, name, description, created_by, created_at, updated_at, deleted_at) FROM stdin;
b0000001-0000-4000-8000-000000000001	a0000001-0000-4000-8000-000000000001	Shelf 1 — Arduino & ESP	Arduino boards, ESP32, ESP8266 modules	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
b0000001-0000-4000-8000-000000000002	a0000001-0000-4000-8000-000000000001	Shelf 2 — Raspberry Pi	Raspberry Pi units and accessories	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
b0000001-0000-4000-8000-000000000003	a0000001-0000-4000-8000-000000000001	Drawer 1 — Sensors	Temperature, humidity, motion sensors	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
b0000001-0000-4000-8000-000000000004	a0000001-0000-4000-8000-000000000002	Shelf 1 — Meters & Testers	Multimeters, oscilloscopes, power supplies	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
b0000001-0000-4000-8000-000000000005	a0000001-0000-4000-8000-000000000002	Drawer 1 — Soldering	Soldering irons, solder wire, flux	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
b0000001-0000-4000-8000-000000000006	a0000001-0000-4000-8000-000000000003	Shelf 1 — Routers & Switches	Network routers, switches, access points	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
b0000001-0000-4000-8000-000000000007	a0000001-0000-4000-8000-000000000003	Drawer 1 — Cables	Ethernet cables, USB cables, HDMI cables	984cd457-8177-4b3d-950f-f51e8244c768	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
\.


--
-- TOC entry 5184 (class 0 OID 26612)
-- Dependencies: 222
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, ip_address, user_agent, payload, last_activity) FROM stdin;
\.


--
-- TOC entry 5183 (class 0 OID 26589)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, email_verified_at, remember_token, created_at, updated_at, deleted_at) FROM stdin;
c77e3813-840a-4a50-9772-9fb0c2a39ba0	Staff Member	staff@ceyntics.com	$2y$12$9.TmEaLZkSz8zQqpFDmu9.IJ5Zqb/YpLwSZn6Ank42CJwoOMDPWbm	staff	\N	\N	2026-03-10 10:27:48	2026-03-10 10:27:48	\N
984cd457-8177-4b3d-950f-f51e8244c768	System Administrator	admin@ceyntics.com	$2y$12$mbNWrdc92r6eWGEWaOYpXOzBiX.5DOTNAtVVdnnkO.iAxpx6o63Ua	admin	\N	\N	2026-03-10 11:11:55	2026-03-10 11:11:55	\N
f43b1137-4a98-44c9-925b-0a03730e32e6	Nimal Perera	nimal@ceyntics.com	$2y$12$mbNWrdc92r6eWGEWaOYpXOzBiX.5DOTNAtVVdnnkO.iAxpx6o63Ua	staff	\N	\N	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
0a985006-c2f0-469b-95b7-49e96f9d953f	Kasuni Silva	kasuni@ceyntics.com	$2y$12$mbNWrdc92r6eWGEWaOYpXOzBiX.5DOTNAtVVdnnkO.iAxpx6o63Ua	staff	\N	\N	2026-03-11 17:43:15.082184	2026-03-11 17:43:15.082184	\N
\.


--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 223
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 4, true);


--
-- TOC entry 5013 (class 2606 OID 26799)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5006 (class 2606 OID 26764)
-- Name: borrowings borrowings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.borrowings
    ADD CONSTRAINT borrowings_pkey PRIMARY KEY (id);


--
-- TOC entry 4988 (class 2606 OID 26664)
-- Name: cupboards cupboards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupboards
    ADD CONSTRAINT cupboards_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 26724)
-- Name: items items_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_code_key UNIQUE (code);


--
-- TOC entry 5004 (class 2606 OID 26722)
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- TOC entry 4984 (class 2606 OID 26646)
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4986 (class 2606 OID 26648)
-- Name: personal_access_tokens personal_access_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_key UNIQUE (token);


--
-- TOC entry 4995 (class 2606 OID 26687)
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- TOC entry 4981 (class 2606 OID 26621)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4975 (class 2606 OID 26608)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4977 (class 2606 OID 26606)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5014 (class 1259 OID 26806)
-- Name: idx_activity_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_action ON public.activity_logs USING btree (action);


--
-- TOC entry 5015 (class 1259 OID 26808)
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);


--
-- TOC entry 5016 (class 1259 OID 26807)
-- Name: idx_activity_logs_model; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_model ON public.activity_logs USING btree (model_type, model_id);


--
-- TOC entry 5017 (class 1259 OID 26810)
-- Name: idx_activity_logs_new_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_new_gin ON public.activity_logs USING gin (new_values);


--
-- TOC entry 5018 (class 1259 OID 26809)
-- Name: idx_activity_logs_old_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_old_gin ON public.activity_logs USING gin (old_values);


--
-- TOC entry 5019 (class 1259 OID 26805)
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);


--
-- TOC entry 5007 (class 1259 OID 26783)
-- Name: idx_borrowings_borrow_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_borrowings_borrow_date ON public.borrowings USING btree (borrow_date);


--
-- TOC entry 5008 (class 1259 OID 26784)
-- Name: idx_borrowings_expected_ret; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_borrowings_expected_ret ON public.borrowings USING btree (expected_return_date);


--
-- TOC entry 5009 (class 1259 OID 26780)
-- Name: idx_borrowings_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_borrowings_item_id ON public.borrowings USING btree (item_id);


--
-- TOC entry 5010 (class 1259 OID 26782)
-- Name: idx_borrowings_processed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_borrowings_processed_by ON public.borrowings USING btree (processed_by);


--
-- TOC entry 5011 (class 1259 OID 26781)
-- Name: idx_borrowings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_borrowings_status ON public.borrowings USING btree (status);


--
-- TOC entry 4989 (class 1259 OID 26670)
-- Name: idx_cupboards_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cupboards_created_by ON public.cupboards USING btree (created_by);


--
-- TOC entry 4990 (class 1259 OID 26671)
-- Name: idx_cupboards_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cupboards_deleted_at ON public.cupboards USING btree (deleted_at);


--
-- TOC entry 4996 (class 1259 OID 26735)
-- Name: idx_items_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_items_code ON public.items USING btree (code);


--
-- TOC entry 4997 (class 1259 OID 26738)
-- Name: idx_items_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_items_created_by ON public.items USING btree (created_by);


--
-- TOC entry 4998 (class 1259 OID 26739)
-- Name: idx_items_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_items_deleted_at ON public.items USING btree (deleted_at);


--
-- TOC entry 4999 (class 1259 OID 26736)
-- Name: idx_items_place_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_items_place_id ON public.items USING btree (place_id);


--
-- TOC entry 5000 (class 1259 OID 26737)
-- Name: idx_items_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_items_status ON public.items USING btree (status);


--
-- TOC entry 4982 (class 1259 OID 26649)
-- Name: idx_pat_tokenable; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pat_tokenable ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- TOC entry 4991 (class 1259 OID 26699)
-- Name: idx_places_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_places_created_by ON public.places USING btree (created_by);


--
-- TOC entry 4992 (class 1259 OID 26698)
-- Name: idx_places_cupboard_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_places_cupboard_id ON public.places USING btree (cupboard_id);


--
-- TOC entry 4993 (class 1259 OID 26700)
-- Name: idx_places_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_places_deleted_at ON public.places USING btree (deleted_at);


--
-- TOC entry 4978 (class 1259 OID 26628)
-- Name: idx_sessions_last_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_last_activity ON public.sessions USING btree (last_activity);


--
-- TOC entry 4979 (class 1259 OID 26627)
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- TOC entry 4971 (class 1259 OID 26611)
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--
-- TOC entry 4972 (class 1259 OID 26609)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4973 (class 1259 OID 26610)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 5035 (class 2620 OID 26816)
-- Name: borrowings trg_borrowings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_borrowings_updated_at BEFORE UPDATE ON public.borrowings FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();


--
-- TOC entry 5032 (class 2620 OID 26813)
-- Name: cupboards trg_cupboards_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_cupboards_updated_at BEFORE UPDATE ON public.cupboards FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();


--
-- TOC entry 5034 (class 2620 OID 26815)
-- Name: items trg_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();


--
-- TOC entry 5031 (class 2620 OID 26817)
-- Name: personal_access_tokens trg_personal_access_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_personal_access_tokens_updated_at BEFORE UPDATE ON public.personal_access_tokens FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();


--
-- TOC entry 5033 (class 2620 OID 26814)
-- Name: places trg_places_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_places_updated_at BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();


--
-- TOC entry 5030 (class 2620 OID 26812)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();


--
-- TOC entry 5029 (class 2606 OID 26800)
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5026 (class 2606 OID 26765)
-- Name: borrowings borrowings_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.borrowings
    ADD CONSTRAINT borrowings_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE RESTRICT;


--
-- TOC entry 5027 (class 2606 OID 26770)
-- Name: borrowings borrowings_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.borrowings
    ADD CONSTRAINT borrowings_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5028 (class 2606 OID 26775)
-- Name: borrowings borrowings_returned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.borrowings
    ADD CONSTRAINT borrowings_returned_by_fkey FOREIGN KEY (returned_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5021 (class 2606 OID 26665)
-- Name: cupboards cupboards_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupboards
    ADD CONSTRAINT cupboards_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5024 (class 2606 OID 26730)
-- Name: items items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5025 (class 2606 OID 26725)
-- Name: items items_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE RESTRICT;


--
-- TOC entry 5022 (class 2606 OID 26693)
-- Name: places places_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5023 (class 2606 OID 26688)
-- Name: places places_cupboard_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_cupboard_id_fkey FOREIGN KEY (cupboard_id) REFERENCES public.cupboards(id) ON DELETE RESTRICT;


--
-- TOC entry 5020 (class 2606 OID 26622)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-03-11 18:11:18

--
-- PostgreSQL database dump complete
--

\unrestrict draUl5ekZBknTsYPsrwE3QLXllKwAUP8eK2gYSmVTdeUiSqtUqM4kmufFqTdunI

